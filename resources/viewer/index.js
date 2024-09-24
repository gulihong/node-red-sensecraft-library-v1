/**
 *
 * @param {*} id
 * @param {*} initData
 * @demmo <iframe id="my-iframe-${i}" src="about:blank" style="border:none;"></iframe> getIframeFn("my-iframe-" + i, perData);
 * @returns
 */

async function getIframeFn(id, initData) {
  let data = await getDataByperFlow(initData);
  var iframe = document.getElementById(id);
  if (iframe) {
    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`<html><head>
    <script src="resources/node-red-contrib-sensecraft-library/viewer/d3.min.js" crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
    <script src="resources/node-red-contrib-sensecraft-library/viewer/jquery.min.js"
        integrity="sha512-3gJwYpMe3QewGELv8k/BX9vcqhryRdzRMxVfq6ngyWXwo03GFEzjsUm8Q7RZcHPHksttq7/GFoxjCVUjkjvPdw=="
        crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="resources/node-red-contrib-sensecraft-library/viewer/flowviewer.js" crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
    <link rel="stylesheet" href="resources/node-red-contrib-sensecraft-library/viewer/flowviewer.css"><style>html,body,.svg-container-noderedjson,.svg-container-noderedjson svg{width:100% !important;height:100% !important;}.data-per{display:none;border:1px solid #abc;}.data-per-0{display:block;}.tab-box{display:flex;flex-wrap:wrap;}span.tab{padding:5px;text-align:center;color:#000;border:1px solid #abc;cursor:pointer;line-height:1;font-size:10px;background:#efefef}span.tab.active{background:#fff}</style></head><body>`);

    for (let i = 0; i < data.length; i++) {
      iframeDoc.write(
        (i == 0 ? `<div class="tab-box">` : ``) +
          `<span class="tab ${i == 0 ? "active" : ""}" index="${i}">${
            data[i][0].label || data[i][0].name || data[i][0].type
          }</span>` +
          (i == data.length - 1 ? `</div>` : "")
      );
    }

    for (let i = 0; i < data.length; i++) {
      iframeDoc.write(
        `<div class="data-per data-per-${i}">
        <pre><code class="language-noderedjson">${JSON.stringify(
          data[i],
          null,
          2
        ).replace(/'/g, '"')}</code></pre>
        <div style="font-size:10px">Type: ${getType(data[i][0].type)}</div>
        </div>`
      );
    }

    iframeDoc.write(`<script>
    $(function () {
        replaceCodeBlocksWithNodeRedFlowImages();
        function svgShowFn () {
            setTimeout(function () {
                var svgs = d3.selectAll(".svg-container-noderedjson svg");
                svgs.each(function () {
                  var svg = d3.select(this);
            
                  svg.html("<g>" + svg.html() + "</g>");
                  var inner = svg.select("g");
                  var zoom = d3.zoom().on("zoom", function (event) {
                    inner.attr("transform", event.transform);
                  });
                  svg.call(zoom);
                });
              }, 500);
        }
        svgShowFn();
        $("span.tab").click(function() {
            $(this).addClass('active').siblings().removeClass('active');
            $(".data-per-" + $(this).attr("index")).show(0).siblings('.data-per').hide(0);
        })
      });
    </script>`);
    iframeDoc.write("</body></html>");
    iframeDoc.close();
  }
  return iframeDoc;
}

async function getDataByperFlow(initData) {
  // 格式化转换 适配预览
  let data = JSON.parse(JSON.stringify(initData));
  let targetData = [];
  for (let i = 0; i < data.length; i++) {
    for (const key in data[i]) {
      if (typeof data[i][key] == "object" && key.indexOf("_") != -1) {
        delete data[i][key];
      }
    }
    delete data[i].w;
    delete data[i].h;
    delete data[i].valid;
    delete data[i].validationErrors;
    delete data[i].changed;
    delete data[i].resize;
    delete data[i].selected;
    delete data[i].dirty;
    if (data[i].type != "tab" && data[i].type != "subflow")
      data[i].wires = data[i].wires || [[]];
    data[i].format = "";
    data[i].func = "";
    data[i].payload = "";
    data[i].info = "";
    if (data[i].type == "tab" || data[i].type == "subflow") {
      targetData.push([data[i]]);
    }
  }
  if (targetData.length == 0) {
    targetData = [data];
  } else {
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < targetData.length; j++) {
        if (data[i].z && data[i].z == targetData[j][0].id) {
          targetData[j].push(data[i]);
          break;
        }
      }
    }
  }
  console.log(targetData);
  return targetData;
}

function getType(type) {
  switch (type) {
    case "tab":
      return "Flow";
    case "subflow":
      return "Subflow";
    default:
      return "Nodes";
  }
}
