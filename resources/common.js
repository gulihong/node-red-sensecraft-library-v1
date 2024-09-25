const libraryUrl = "/library/local/flows/sensecraft-flows/";
let flowList = null; // flow列表
let currentFlow = null; // 当前所选flow
let isDown = true; // true为倒序排列
let currentTab = 1; // 1--my;2--community

// 保存json到本地
function setJsonFn(url, data) {
  // 判断是否重复
  if (flowList && flowList.length > 0) {
    for (let i = 0; i < flowList.length; i++) {
      if (flowList[i].fn == url) {
        const myNotification = RED.notify(
          "Flow rename, whether to replace the old Flow",
          {
            modal: true,
            fixed: true,
            type: "warning",
            buttons: [
              {
                text: "cancel",
                click: function (e) {
                  myNotification.close();
                  showSaveSetting(false);
                },
              },
              {
                text: "okay",
                class: "primary",
                click: function (e) {
                  myNotification.close();
                  setJsonFn(url, data);
                },
              },
            ],
          }
        );
        return false;
      }
    }
  }
  confirmSetJson(url, data);
  editPageShowFn(".page1");
}

// 添加json文件的接口
function confirmSetJson(url, data) {
  url = url.slice(0, url.indexOf(".json") + 5);
  // console.log(url, 'save-url')
  $.ajax({
    url: libraryUrl + url,
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(data, null, 2),
    success: (res) => {
      getLocallist();
    },
    error: (err) => {
      console.log(err);
    },
  });
}

// 查看详情
async function perClickFn(e) {
  let url = $($(this)[0]).attr("name");
  if (currentTab == 1) {
    url = url.slice(0, url.indexOf(".json") + 5);
  }
  let data = await fetchJson(currentTab == 2 ? url : libraryUrl + url);
  if (currentTab == 2) {
    data = window.atob(data.content);
    // 将二进制字符串转换为 UTF-8 编码的文本
    const binaryLen = data.length;
    const bytes = new Uint8Array(binaryLen);
    for (let i = 0; i < binaryLen; i++) {
      bytes[i] = data.charCodeAt(i);
    }
    // 使用 TextDecoder 进行 UTF-8 解码
    const decoder = new TextDecoder('utf-8');
    data = decoder.decode(bytes);
    data = JSON.parse(data);
  }
  currentFlow = null;
  currentFlow = {
    url,
    data,
  };
  const _sensecraft_config = await getSensecraftConfig(data);
  editPageShowFn(".page2");
  $(".detail .title").text(_sensecraft_config.name);
  $(".detail .desc").text(_sensecraft_config.desc);
  $(".detail .info .editor").html(_sensecraft_config.introduction);
  $(".detail .right .info").html(`<div>
  <div>Created at: <span class="bold">${formatTimestamp(_sensecraft_config.time, 1)}</span></div>
  ${currentTab == 2 ? '<div>Owner: <span class="bold">' + _sensecraft_config.author + '</span></div>' : ''}
  ${currentTab == 2 ? '<div>Version: <span class="bold">' + _sensecraft_config.version + '</span></div>' : ''}
  </div>`);
  $(".page2 .save-box").hide(0).siblings(".info").show(0);
  if (currentTab == 2) {
    $('.detail .opera-box').hide(0); // 隐藏操作按钮
  } else {
    $('.detail .opera-box').show(0);
  }
}

function operateBtnClick() {
  const _sensecraft_config = getSensecraftConfig(currentFlow.data);
  $(".page2 #update-name").val(_sensecraft_config.name);
  $(".page2 #update-desc").val(_sensecraft_config.desc);
  const elClass = $(this)[0].className;
  currentFlow.type =
    elClass.indexOf("delete") != -1
      ? "delete"
      : elClass.indexOf("share") != -1
        ? "share"
        : "rename";
  if (currentFlow.type == "delete") {
    // 删除json文件
    const myNotification = RED.notify(
      `Sure to delete this flow(${_sensecraft_config.name})?`,
      {
        modal: true,
        fixed: true,
        type: "warning",
        buttons: [
          {
            text: "cancel",
            click: function (e) {
              myNotification.close();
            },
          },
          {
            text: "delete",
            class: "primary",
            click: function (e) {
              myNotification.close();
              deleteLocalJson(currentFlow.url);
              editPageShowFn(".page1");
            },
          },
        ],
      }
    );
  } else {
    editPageShowFn(".page2");
    // 编辑或者分享
    $(".page2 .save-box").show(0).siblings(".info").hide(0);
    $(".quill-editor-box").hide(0);
    if (currentFlow.type == "share") {
      $(".quill-editor-box").show(0);
    }
    $("#btn-update")[0].innerText = capitalizeFirstLetter(currentFlow.type);
  }
}

// 获取本地flow列表
function getLocallist() {
  currentTab = 1;
  showSaveSetting(false);
  $("#save-btn-box").show(0);
  $.ajax({
    url: libraryUrl,
    type: "GET",
    contentType: "application/json; charset=utf-8",
    success: async (res) => {
      if (res) {
        flowList = null;
        flowList = await getItemInfoBySplit(res);
        await showDataList(flowList);
      }
    },
    error: (err) => {
      console.log(err);
    },
  });
}

function showDataList(data) {
  // 排序
  data = data.sort((a, b) => (isDown ? b.time - a.time : a.time - b.time));
  let parentNode = $("#sensecraft-list-box");
  parentNode.children().remove();
  // 读取json文件并渲染
  for (let i = 0; i < data.length; i++) {
    parentNode.append(
      `<div class="sensecraft-data-item" name="${data[i].url || data[i].fn}">
          <div class="title" title="${data[i].name || ""}">${data[i].name || ""
      }</div>
          <div class="desc" title="${data[i].desc || ""}">${data[i].desc || ""
      }</div>
          <div class="bottom">
            <div>${currentTab == 2 ? data[i].author : ''}</div>
            <div class="time">${(data[i].time && formatTimestamp(data[i].time, 1)) || ""}</div>
          </div>
          </div>`
    );
  }
}

function showSaveSetting(bool) {
  bool = typeof bool != "boolean" ? false : bool;
  if (bool) $(".page1 .save-box").show(0);
  else $(".page1 .save-box").hide(0);
  if (bool) {
    $("#save-name").focus();
  } else {
    $("#save-name").val("");
    $("#save-desc").val("");
    $("#save-btn-box .tabs span").removeClass("active");
  }
}

async function saveFlowsFn() {
  const name = $("#save-name").val();
  const desc = $("#save-desc").val();
  if (!name) return RED.notify("Please input the name to save", "warning");
  if (!desc)
    return RED.notify("Please input the description to save", "warning");
  const currentIndex = $(".tabs.save span.active").attr("index");
  const _sensecraft_config = {
    name: name,
    desc: desc,
    time: new Date().getTime(),
    type: $(".tabs.save span.active").attr("index"),
    author: 'my',
    version: '0.0.1',
    introduction: "",
  };
  let nodeArr = [];
  let data = [];
  if (currentIndex == 1) {
    // 保存当前所选节点
    nodeArr = await getNodeDataAll("selected", true);
  } else if (currentIndex == 2) {
    // 获取当前flows id
    let workspaceId = RED.workspaces.active();
    let subFlowInfo = null;
    // 获取所有subflows
    await RED.nodes.eachSubflow(function (subflow) {
      subflow = Object.assign({}, subflow);
      if (subflow.id == workspaceId) {
        subFlowInfo = subflow;
      }
    });

    if (!subFlowInfo) {
      // 保存当前所选flows下面的所有节点
      // 获取当前tab
      const currentTab = RED.nodes.workspace(workspaceId);
      data.push(currentTab);
    } else {
      let wireDetails = [];
      // Iterate over all nodes
      await RED.nodes.eachLink(function (link) {
        if (link.source.z === workspaceId || link.target.z === workspaceId) {
          wireDetails.push({
            source: link.source.id,
            target: link.target.id
          });
        }
      });
      delete subFlowInfo.instances
      subFlowInfo.out = subFlowInfo.out.map((item) => { return { x: item.x, y: item.y, wires: getWiresBySubflowFn(wireDetails, item.id) } })
      subFlowInfo.in = subFlowInfo.in.map((item) => { return { x: item.x, y: item.y, wires: getWiresBySubflowFn(wireDetails, item.id) } })
      subFlowInfo.status = { x: subFlowInfo.status.x, y: subFlowInfo.status.y, wires: getWiresBySubflowFn(wireDetails, subFlowInfo.status.id) }
      subFlowInfo.inputs = subFlowInfo.in.length
      subFlowInfo.outputs = subFlowInfo.out.length
      data.push(subFlowInfo);
    }
    // 获取当前页所有节点
    nodeArr = await getNodeDataAll("z", workspaceId);
  } else {
    // 获取页面所有tab
    RED.nodes.eachWorkspace(function (worksapce) {
      worksapce = Object.assign({}, worksapce);
      data.push(worksapce);
    });
    // 获取所有subflows
    // RED.nodes.eachSubflow(function (subflow) {
    //   subflow = Object.assign({}, subflow);
    //   delete subflow.instances
    //   data.push(subflow);
    // });
    // 获取所有config
    RED.nodes.eachConfig(function (config) {
      config = Object.assign({}, config);
      data.push(config);
    });
    nodeArr = await getNodeDataAll();
  }
  data.push.apply(data, nodeArr);
  // return
  if (data.length == 0) return RED.notify("No nodes selected.", "warning");
  data.push({
    "id": "ff55500100010001",
    "type": "comment",
    "name": "",
    "info": "",
    "_sensecraft_config": _sensecraft_config,
  }
  )
  console.log(data);
  setJsonFn(
    `flow-${_sensecraft_config.type}$${_sensecraft_config.author}$${wordsToHyphens(name)}$${_sensecraft_config.version}$${_sensecraft_config.time
    }$${desc}.json`,
    data
  );
}

function getWiresBySubflowFn(wireDetails, target) {
  for (let i = 0; i < wireDetails.length; i++) {
    if (wireDetails[i].target == target) return [[wireDetails[i].source]]
  }
  return []
}

// 获取节点连线数据
function getNodeDataAll(key, value) {
  let arr = [];
  // 获取页面所有group
  RED.nodes.eachGroup(function (group) {
    group = Object.assign({}, group);
    for (const key in group) {
      if (typeof group[key] == "object" && key != "style" && key != "nodes")
        delete group[key];
    }
    group.nodes = group.nodes.map((per) => {
      return Object.assign({}, per).id;
    });
    if (key && value) {
      if (group[key] == value) arr.push(group);
    } else {
      arr.push(group);
    }
  });
  //获取带有连线数据的节点信息
  RED.nodes.eachNode(function (node) {
    let wires = RED.nodes.getDownstreamNodes(node).map((item) => {
      return Object.assign({}, item).id;
    });

    let nodeObj = Object.assign({}, node);
    nodeObj.wires = nodeObj.outputs !== 0 ? [wires] : [];
    if (key && value) {
      if (nodeObj[key] == value) arr.push(nodeObj);
    } else {
      arr.push(nodeObj);
    }
  });
  return arr;
}

// 本地json是否显示编辑页面
function editPageShowFn(showClass) {
  if (showClass != ".page2") {
    $("#update-name").val("");
    $("#update-desc").val("");
    $("#quill-editor > .ql-editor").html("<p></p>");
  }
  $(showClass).show(0).siblings(".page").hide(0);
}

function deleteLocalJson(url) {
  $.ajax({
    url: "/sensecraft-api/delete-json",
    type: "POST",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ url: libraryUrl + url }),
    success: async (res) => {
      if (res && res.status == "ok") {
        getLocallist();
      }
    },
    error: (err) => {
      console.log(err);
    },
  });
}

// 本地json重命名或者分享操作
function confirmJsonFn() {
  if (!currentFlow) return;
  let info = getSensecraftConfig(currentFlow.data);
  const name = $("#update-name").val();
  const desc = $("#update-desc").val();
  if (currentFlow.type == "rename") {
    // 修改的信息未发生变化
    if (info.name == name && info.desc == desc) {
      $(".page2 .save-box").hide(0).siblings(".info").show(0);
    } else {
      // 重命名
      info.name = name;
      info.desc = desc;
      info.time = new Date().getTime();
      let newData = [];
      for (let i = 0; i < currentFlow.data.length; i++) {
        if (currentFlow.data[i]._sensecraft_config)
          currentFlow.data[i]._sensecraft_config = info;
        newData.push(currentFlow.data[i]);
      }
      const url = `flow-${info.type}$my$${wordsToHyphens(name)}$0.0.1$${info.time}$${desc}.json`;
      // 新增json
      confirmSetJson(url, newData);
      // 删除旧的json
      deleteLocalJson(currentFlow.url);
      $(".page2 .save-box").hide(0).siblings(".info").show(0);
      // 更新详情展示
      $(".detail .title").text(name);
      $(".detail .desc").text(desc);
      currentFlow.url = url;
    }
  } else {
    // 分享
    const intro = window.quill.root.innerHTML;
    console.log(currentFlow, window.quill);
  }
}

function importJsonFn() {
  const elId = $(".page2 .tabs.import span.active")[0].id.replace(
    "import-",
    ""
  );
  if (elId == "override") return overrideFn();
  // 调起导入弹框
  RED.clipboard.import();
  let data = JSON.parse(JSON.stringify(currentFlow && currentFlow.data));
  $("#red-ui-clipboard-dialog-import-text")
    .val(JSON.stringify(data))
    .trigger("paste");
  $("#red-ui-clipboard-dialog-import-opt-" + elId)
    .addClass("selected")
    .siblings("a")
    .removeClass("selected");
}

function overrideFn() {
  // 替换现有项目中的选中节点
  // 替换现有项目中的选中节点
  // 替换现有项目中的选中节点
}

async function getCommunity() {
  const token = await getCookie('github-token');
  currentTab = 2;
  // 从cookie中读取是否有token
  if (token) {
    try {
      const response = await fetch('https://api.github.com/repos/Seeed-Studio/Hazard-Response-Mission-Pack/git/trees/main?recursive=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      // 处理 API 响应
      const data = await response.json();
      if (data.tree) {
        let arr = [];
        for (let i = 0; i < data.tree.length; i++) {
          if (data.tree[i].path.indexOf(".sharing.json") != -1) {
            let jsonName = data.tree[i].path.split('/')
            jsonName = jsonName[jsonName.length - 1]
            jsonName = jsonName.replace('.sharing', '')
            arr.push({ fn: jsonName, url: data.tree[i].url })
          }
        }
        arr = getItemInfoBySplit(arr)
        flowList = null;
        flowList = arr;
        showDataList(arr)
      } else {
        gotoGetToken()
      }
    } catch (error) {
      gotoGetToken()

    }
    return
  }
  gotoGetToken()
}

function gotoGetToken() {
  // 没有token前往授权
  $.ajax({
    url: "/sensecraft-api/get-community",
    type: "GET",
    contentType: "application/json; charset=utf-8",
    data: {
      redirect: window.location.href,
    },
    success: async (response) => {
      if (response.redirect) window.location.href = response.redirect;
    },
    error: (err) => {
      console.log(err);
    },
  });
}

// 一些公用方法
// 根据文件名拆分字段
function getItemInfoBySplit(data) {
  for (let i = 0; i < data.length; i++) {
    const itemArr = data[i].fn.replace(".json", "").split("$");
    data[i].type = itemArr[0].replace("flow-", "");
    data[i].author = itemArr[1];
    data[i].name = itemArr[2];
    data[i].version = itemArr[3];
    data[i].time = itemArr[4];
    data[i].desc = itemArr[5];
  }
  return data;
}

// 获取_sensecraft_config
function getSensecraftConfig(per) {
  let _sensecraft_config = per.filter((item) => item.id == "ff55500100010001" && item.type == "comment" && item._sensecraft_config)
  _sensecraft_config = _sensecraft_config[0]._sensecraft_config;
  return _sensecraft_config;
}

// 首字母转大写
function capitalizeFirstLetter(str) {
  if (typeof str !== "string" || str.length === 0) {
    return str; // Return the original string if it's not a string or is empty
  }

  // Capitalize the first letter and concatenate with the rest of the string
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 封装获取 JSON 数据的异步函数
async function fetchJson(url) {
  try {
    url = url.slice(0, url.indexOf(".json") + 5);
    // 使用 fetch API 获取数据
    const response = await fetch(url);

    // 检查响应是否成功
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }

    // 解析 JSON 数据
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching JSON:", error);
    return null; // 发生错误时返回 null
  }
}

// 排序
function directionFn() {
  isDown = !isDown;
  if (isDown) {
    $("img.upright").hide(0).siblings("img.reverse").show(0);
  } else {
    $("img.upright").show(0).siblings("img.reverse").hide(0);
  }
  if (currentTab == 1) getLocallist();
  else getCommunity();
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
}


function wordsToHyphens(str) {
  return str.toLowerCase().replace(/\s+/g, "-");
}

function formatTimestamp(timestamp, type) {
  timestamp = Number(timestamp);
  // 创建一个 Date 对象
  const date = new Date(timestamp);

  // 提取日期和时间
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从0开始，所以需要 +1
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // 格式化日期时间字符串
  return type == 1 ? `${year}/${month}/${day}` : `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

$(document).ready(function () {
  // 给未来元素添加事件
  $(document).on("click", ".sensecraft-data-item", perClickFn);
  $(document).on("click", "#btn-save", saveFlowsFn);
  $(document).on("click", "#btn-cancel", showSaveSetting);
  $(document).on("click", ".page2 #btn-update", confirmJsonFn);
  $(document).on("click", "#direction-btn", directionFn);
});
