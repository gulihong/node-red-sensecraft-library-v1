const path = require("path"),
    fs = require("fs-extra");

module.exports = function (RED) {
    // local file
    const localFileDir = RED.settings.userDir + "/lib/flows/";
    let githubToken;
    let currentUrl;

    // delete json
    RED.httpAdmin.post("/sensecraft-api/delete-json", deleteJsonFn);
    async function deleteJsonFn(req, res) {
        if (!req.body || !req.body.url)
            return RED.notify("No selected json", "warning");
        try {
            // Ensure request body contains the file path
            let jsonUrl = req.body.url.slice(
                req.body.url.indexOf("sensecraft-flows")
            );
            jsonUrl = await path.resolve(localFileDir, jsonUrl);
            await fs.remove(jsonUrl);
            await res.send({ status: "ok" });
        } catch (error) {
            res.status(404).send();
        }
    }

    // 获取token
    RED.httpAdmin.get("/sensecraft-api/oauth/redirect", getGitHubCode);
    async function getGitHubCode(req, res) {
        const code = req && req.query.code
        if (code) {
            try {
                const response = await fetch('https://sensecraft-node-red-oauth.sensecraft.ai/exchange-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ code: code })
                });

                // 处理 API 响应
                const data = await response.json();
                githubToken = data.access_token;

                // 重新读取github数据
                await getCommunity(req, res);

            } catch (error) {
                res.status(500).send('Error exchanging token');
            }
        } else { res.status(400).send('Authorization code missing'); }
    }

    // 查看是否有token
    RED.httpAdmin.get("/sensecraft-api/get-community", getCommunity);
    async function getCommunity(req, res) {
        if (req.query.redirect) currentUrl = req.query.redirect;
        if (!githubToken) {
            // fill in your cliend_id
            const client_id = 'Iv23liHwruJPznYal0MN';
            const authorize_uri = 'https://github.com/login/oauth/authorize';
            const redirect_uri = `http://${req.headers.host}/sensecraft-api/oauth/redirect`;
            res.status(200).send({ redirect: `${authorize_uri}?client_id=${client_id}&redirect_uri=${redirect_uri}` });
            return false;
        }

        // 将token存储到cookie里
        res.cookie('github-token', githubToken, { maxAge: 8 * 60 * 60 * 1000, });
        if (req.originalUrl.indexOf('sensecraft-api/oauth/redirect') !== -1) res.redirect(301, `${currentUrl}`);
    }

    function setSensecraftData(config) {
        RED.nodes.createNode(this, config);
    }

    RED.nodes.registerType("sensecraft-index", setSensecraftData);
};
