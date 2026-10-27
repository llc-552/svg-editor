# SVG Editor — Lab1 Phase 1

用 TypeScript 开发的面向对象 SVG 命令行编辑器。通过命令创建图形、组织嵌套分组、撤销重做，并读写标准 SVG 文件。

## 快速开始

需要 Node.js 22 或更新版本和 npm。在项目目录执行：

```sh
npm ci
npm run cli
```

看到 `svg>` 后逐行输入：

```text
init 800 600
create g node
create rect background 100 100 160 60 #4a90d9 in node
create text label 135 135 "开始" in node
tree
move node 50 0
undo
save demo.svg
```

用浏览器打开生成的 `demo.svg`。编辑器内输入 `help` 查看全部命令。Ctrl+D 结束输入；Windows 终端也可以使用 Ctrl+Z 后回车。

如果无法连接 npm 仓库且本机正在使用代理，可以为安装命令指定代理，例如：

```sh
npm ci --proxy=http://127.0.0.1:7897
```

地址应以自己的代理软件设置为准。工程没有写入固定 npm 代理配置。

## 构建与验证

```sh
npm run typecheck
npm test
npm run build
npm start
```

或者运行 `npm run check`，依次完成类型检查、测试和构建。构建产物在 `dist/`，不会提交到 Git。

## 示例回放

在 PowerShell 中执行：

```powershell
New-Item -ItemType Directory -Path output -Force | Out-Null
Get-Content -Encoding UTF8 fixtures/flowchart.commands | npm run cli
```

在 Git Bash 中执行：

```sh
mkdir -p output
npm run cli < fixtures/flowchart.commands
```

结果为 `output/flowchart.svg`，包含两个矩形文字节点和一条连线。`output/` 是生成物目录，已被 Git 忽略。

`fixtures/session.commands` 对应需求中的典型会话。其中两次 `error:` 是有意验证的场景：同时分组祖先与后代、保存后尝试撤销。该会话最后读入 `fixtures/other.svg`；要保护该输入样例，不要在读入后额外执行无参数 `save`。

## 命令概览

| 类别 | 命令 |
|---|---|
| 文档 | `init [w] [h]`、`read <file.svg>`、`save [file.svg]`、`canvas [w h]` |
| 创建 | `create <type> <id> [params...] [in <containerId>]` |
| 编辑 | `delete`、`move`、`scale`、`set` |
| 层级与顺序 | `group`、`ungroup`、`addto`、`front`、`back` |
| 查询 | `tree [id]`、`show <id>`、`help` |
| 历史 | `undo`、`redo` |

内置类型为 `rect`、`circle`、`ellipse`、`line`、`text`、`g`。所有图形使用唯一且区分大小写的 ID；带空格的参数使用双引号。以 `#` 开头的整行可作为注释，颜色参数中的 `#` 不受影响。

重要行为：

- `scale` 同时缩放位置和尺寸，因子必须大于零。
- 一条成功编辑命令对应一个撤销单元；失败命令保持文档及历史不变。
- 成功新建、读取、保存或修改画布尺寸后，清空旧历史并暂时禁用撤销重做，下一次成功编辑重新启用。
- 无参数 `save` 使用最近成功读取或保存的路径；首次保存必须指定路径。
- `ungroup` 按作业规定禁止解散直接位于 SVG 根下的分组。
- `front` 移到同级序列末尾，视觉上靠前；`back` 相反。
- 非交互回放不打印提示符，错误后继续处理下一行；批处理验收应检查输出中的 `error:`，不能只依赖进程退出码。

## 支持边界

当前是 Phase 1，不包含图形界面、`box` 或插件系统。

SVG 导入只支持上述六种图形及明确允许的属性。未知标签、`transform`、`style`、不匹配的 `viewBox` 等会明确报错，避免静默丢失数据；本程序不是通用 SVG 文件编辑器。详细支持范围、架构图、设计模式和验证记录见 [doc/README.md](./doc/README.md)。

## 项目文档

- [原始需求](./phase_cli_1.md)
- [开发计划与进度](./DEVELOPMENT_PLAN.md)
- [架构、决策、协作过程和质量记录](./doc/README.md)

源码位于 `src/`，自动化测试位于 `tests/`，输入样例位于 `fixtures/`。
