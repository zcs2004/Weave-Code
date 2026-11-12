# Weave Code（织码）

Weave Code 是一款面向 HarmonyOS 平板与 2in1 设备的网页开发工具，将项目管理、代码编辑、问题检查、实时预览、可视化设计和 Cloud Code 辅助集中在同一个工作界面中。

应用针对大屏、触控和键盘操作进行了适配，适合学习 HTML、CSS 与 JavaScript，也可用于制作网页原型、维护本地前端项目和快速查看代码修改效果。

当前源码版本：`1.0.2`

## 主要功能

### 项目管理

- 创建默认项目或打开本地项目目录；
- 通过清晰的文件树管理代码、图片和其他项目资源；
- 新建、复制、重命名和整理文件；
- 从 Git 仓库获取已有项目；
- 提供 Hello World、网页游戏、博客、仪表板和 Bootstrap 等示例项目。

### 代码编辑

- 编辑 HTML、CSS、JavaScript 等网页文件；
- 支持语法高亮和代码补全建议；
- 通过问题面板集中查看检测到的语法问题及其位置；
- 支持触控操作与键盘快捷键，适配大屏开发场景。

### 实时预览

- 在编辑代码的同时查看网页效果；
- 根据当前任务调整文件面板、编辑区域和预览区域；
- 减少在编辑器与浏览器之间反复切换。

### 可视化设计

- 在设计模式中选择页面组件并查看相关属性；
- 调整页面元素和布局关系；
- 支持通过拖动排序重新安排页面组件；
- 可视化操作与源代码编辑相互配合。

### Cloud Code

- 结合当前文件与编辑器上下文辅助解释代码；
- 检查当前文件中可能存在的问题；
- 提供修改思路和代码处理建议。

Cloud Code 的输出仅用于辅助理解和开发，实际修改仍需结合项目要求进行检查与测试。

### 账号与会员

- 支持织码账号登录、账号信息与密码管理；
- 支持试用、连续包月和终身 VIP 权益；
- HarmonyOS 版本通过华为应用内支付完成商品购买与订单核验；
- Debug 构建使用华为支付沙盒环境，Release 构建使用生产环境。

### 多语言界面

应用界面、菜单、设置项、账号与会员界面支持多语言显示。切换应用语言后，相关功能名称和提示文字会同步更新。

## 适用场景

- 学习 HTML、CSS 和 JavaScript；
- 编写、调整和预览网页页面；
- 制作网页原型和小型前端项目；
- 管理本地网页工程；
- 在 HarmonyOS 平板或 2in1 设备上进行前端开发；
- 借助 Cloud Code 理解、检查和修改代码。

## 支持平台

- HarmonyOS tablet
- HarmonyOS 2in1
- 目标 SDK：HarmonyOS 6.1.1（API 24）

## 源码结构

```text
AppScope/                         应用级配置与资源
entry/src/main/ets/              ArkTS 应用外壳及原生桥接
entry/src/main/resources/        应用资源与内置 Web 编辑器运行时
hvigor/                          Hvigor 构建配置
build-profile.json5              产品、模块和构建模式配置
LICENSE                          GNU AGPLv3 完整许可证文本
NOTICE                           项目及第三方版权声明
UPSTREAM.md                      Phoenix 上游来源与修改说明
EXTENSION_LICENSES.md            内置扩展许可证清单
LEGAL_RELEASE_CHECKLIST.md       公开发行前的合规检查事项
```

公开源码的具体收录与排除范围见 [SOURCE_SCOPE.md](SOURCE_SCOPE.md)。

## 构建要求

- DevEco Studio；
- HarmonyOS SDK 6.1.1（API 24）；
- DevEco Studio 随附的 JBR，或该版本支持的 Java 运行环境；
- Hvigor 所需的 Node.js 环境。

在 DevEco Studio 中打开项目并构建 `entry` 模块，或者使用 DevEco Studio 提供的 Hvigor Wrapper：

```text
hvigorw --mode module -p product=default -p module=entry@default -p buildMode=debug assembleHap
```

仓库不包含签名证书、签名密码、华为 IAP 私钥、服务器密钥或真实的 `agconnect-services.json`。如需使用 AGConnect 登录或华为应用内支付，请使用自己的华为项目配置，并将敏感文件保留在本地或受保护的服务器环境中，不要提交到 Git。

未配置本地签名时，构建结果为 unsigned HAP。

## 支付环境

支付环境由构建模式自动选择：

- Debug：`IAP_ENVIRONMENT=SANDBOX`
- Release：`IAP_ENVIRONMENT=NORMAL`

生产环境支付仍需要有效的华为项目、商品配置、发布签名以及安全的服务器订单核验服务。私钥只能保存在服务器端，不能放入 ArkTS、Web 资源、HAP 或公开仓库。

## 开源许可证

Weave Code 以 `GNU AGPL-3.0-or-later` 许可证提供，完整文本见 [LICENSE](LICENSE)。编辑器运行时参考并派生自 [Phoenix](https://github.com/phcode-dev/phoenix)，相关来源、修改和第三方声明见：

- [OPEN_SOURCE.md](OPEN_SOURCE.md)
- [NOTICE](NOTICE)
- [UPSTREAM.md](UPSTREAM.md)
- [EXTENSION_LICENSES.md](EXTENSION_LICENSES.md)

当前源码中的 Phoenix 精确上游版本仍需确认，两个内置扩展的再分发许可证也仍待解决。完成这些事项前，不应将当前源码描述为已经完成最终法律审查；详情见 [LEGAL_RELEASE_CHECKLIST.md](LEGAL_RELEASE_CHECKLIST.md)。

## 项目地址

- GitHub：<https://github.com/zcs2004/Weave-Code>

Weave Code 希望让网页项目的管理、代码编写、页面设计与实时预览更加清晰、连贯，并为 HarmonyOS 大屏设备提供更适合的前端开发体验。
