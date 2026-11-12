# 扩展包许可证清单

本清单由 `extension-cloud-mirror/extensions/` 中 ZIP 包的 `package.json` 和内嵌许可证文件机械提取，审计日期为 2026-10-26。它用于发布前排查，不是法律结论，也不能替代阅读许可证全文或核对扩展来源。

当前共 51 个扩展包：2 个既没有声明许可证也没有内嵌许可证文件；11 个只在元数据中声明许可证但没有内嵌文本；6 个带许可证文件但 package.json 没有声明。

## 发布前处理

1. 对“待确认”项目找到可信的原始仓库或作者发布页，确认许可证、版本和再分发权限。
2. 对只有 SPDX/名称声明而没有许可证全文的扩展，补入对应版本的许可证文件，并保留原版权声明。
3. 对只有内嵌文件而没有元数据声明的扩展，阅读文件内容后补充准确的许可证标识。
4. 无法确认来源或再分发权利的扩展，应从 ZIP 目录、注册表和 HAP 资源中移除。
5. 修改扩展内容时还要检查其许可证是否要求公开修改后的对应源码。

## 高优先级待确认

- `response-for-brackets-0.1.0.zip`：未在 package.json 声明许可证，ZIP 中也未找到常见许可证/NOTICE 文件名。
- `talmand.html-templates-1.3.5.zip`：未在 package.json 声明许可证，ZIP 中也未找到常见许可证/NOTICE 文件名。

## 完整清单

| ZIP 文件 | 包名 | 版本 | 元数据声明 | ZIP 内许可证/NOTICE | 状态 |
| --- | --- | --- | --- | --- | --- |
| `80s-baby-1.0.2.zip` | `80s-baby` | `1.0.2` | MIT | LICENSE | 有声明和内嵌文件 |
| `angularui.angularjs-1.1.2.zip` | `angularui.angularjs` | `1.1.2` | MIT | 未找到 | 待补许可证文本 |
| `brackets-code-folding-0.3.5.zip` | `brackets-code-folding` | `0.3.5` | MIT | 未找到 | 待补许可证文本 |
| `brackets-lorem-ipsum-1.2.1.zip` | `brackets-lorem-ipsum` | `1.2.1` | MIT | 未找到 | 待补许可证文本 |
| `brackets-material-dark-theme-1.1.0.zip` | `brackets-material-dark-theme` | `1.1.0` | MIT | brackets-material-dark-theme/LICENSE | 有声明和内嵌文件 |
| `brackets-php-syntax-hint-1.1.6.zip` | `brackets-php-syntax-hint` | `1.1.6` | MIT | 未找到 | 待补许可证文本 |
| `brackets-theme-darktooth-0.1.0.zip` | `brackets-theme-darktooth` | `0.1.0` | MIT | brackets-theme-darktooth/LICENSE | 有声明和内嵌文件 |
| `brackets-vimderbar-0.11.1.zip` | `brackets-vimderbar` | `0.11.1` | MIT | brackets-vimderbar-0.11.1/LICENSE.txt | 有声明和内嵌文件 |
| `brackets-wakatime-1.0.8.zip` | `brackets-wakatime` | `1.0.8` | BSD | brackets-wakatime-master/LICENSE | 有声明和内嵌文件 |
| `camden.jshint-2.2.20.zip` | `camden.jshint` | `2.2.20` | MIT | brackets-jshint-master/LICENSE<br>brackets-jshint-master/NOTICE | 有声明和内嵌文件 |
| `dark_soda_theme-0.1.6.zip` | `dark_soda_theme` | `0.1.6` | MIT | LICENSE.md | 有声明和内嵌文件 |
| `dark-revolution-1.9.1.zip` | `dark-revolution` | `1.9.1` | MIT | dark-revolution-master/LICENSE | 有声明和内嵌文件 |
| `dark-wild-chery-1.0.2.zip` | `dark-wild-chery` | `1.0.2` | 未声明 | LICENSE | 待核对元数据 |
| `delkos-0.0.5.zip` | `delkos` | `0.0.5` | MIT | Brackets-Delkos-Dark-Theme-master/LICENSE | 有声明和内嵌文件 |
| `dnbard.documents-toolbar-0.5.22.zip` | `dnbard.documents-toolbar` | `0.5.22` | MIT | 未找到 | 待补许可证文本 |
| `dracula-1.0.0.zip` | `dracula` | `1.0.0` | MIT | brackets-master/LICENSE | 有声明和内嵌文件 |
| `dustindowell.neon-1.1.8.zip` | `dustindowell.neon` | `1.1.8` | MIT | LICENSE | 有声明和内嵌文件 |
| `earth-0.2.7.zip` | `earth` | `0.2.7` | MIT | LICENSE | 有声明和内嵌文件 |
| `easy-dark-2.0.4.zip` | `easy-dark` | `2.0.4` | 未声明 | EasyDark-master/LICENSE | 待核对元数据 |
| `edc.brackets-snippets-1.8.1.zip` | `edc.brackets-snippets` | `1.8.1` | MIT | LICENSE<br>widget/thirdparty/ace-builds/LICENSE | 有声明和内嵌文件 |
| `fixthecode-1.2.9.zip` | `fixthecode` | `1.2.9` | MIT | FixTheCode-master/LICENSE | 有声明和内嵌文件 |
| `fthiagogv.naturegreen-dark-syntax-0.0.2.zip` | `fthiagogv.naturegreen-dark-syntax` | `0.0.2` | MIT | naturegreen-dark-syntax/LICENSE.md | 有声明和内嵌文件 |
| `gruehle.markdown-preview-1.0.11.zip` | `gruehle.markdown-preview` | `1.0.11` | MIT | MarkdownPreview-master/LICENSE | 有声明和内嵌文件 |
| `hirse.outline-list-1.6.0.zip` | `hirse.outline-list` | `1.6.0` | MIT | package/LICENSE | 有声明和内嵌文件 |
| `ivogabe.icons-1.5.7.zip` | `ivogabe.icons` | `1.5.7` | MIT | 未找到 | 待补许可证文本 |
| `jrowny.brackets.snippets-1.1.0.zip` | `jrowny.brackets.snippets` | `1.1.0` | MIT | brackets-snippets-1.1.0/LICENSE | 有声明和内嵌文件 |
| `lamo2k123.brackets-file-tree-1.1.1.zip` | `lamo2k123.brackets-file-tree` | `1.1.1` | MIT | 未找到 | 待补许可证文本 |
| `le717.html-skeleton-1.4.3.zip` | `le717.html-skeleton` | `1.4.3` | MIT | LICENSE | 有声明和内嵌文件 |
| `lion-1.0.0.zip` | `lion` | `1.0.0` | MIT | LICENSE | 有声明和内嵌文件 |
| `mackenza.php-smarthints-1.2.2.zip` | `mackenza.php-smarthints` | `1.2.2` | MIT | Brackets-PHP-SmartHints-1.2.2/LICENSE<br>Brackets-PHP-SmartHints-1.2.2/NOTICE | 有声明和内嵌文件 |
| `martypenner.autosave-files-on-window-blur-1.0.7.zip` | `martypenner.autosave-files-on-window-blur` | `1.0.7` | MIT | LICENSE | 有声明和内嵌文件 |
| `mikaeljorhult.brackets-autoprefixer-0.7.5.zip` | `mikaeljorhult.brackets-autoprefixer` | `0.7.5` | MIT | brackets-autoprefixer-0.7.5/LICENSE | 有声明和内嵌文件 |
| `mikaeljorhult.brackets-todo-0.9.7.zip` | `mikaeljorhult.brackets-todo` | `0.9.7` | MIT | 未找到 | 待补许可证文本 |
| `monokai-corail-ur-1.2.8.zip` | `monokai-corail-ur` | `1.2.8` | MIT | 未找到 | 待补许可证文本 |
| `monokai-theme-1.0.8.zip` | `monokai-theme` | `1.0.8` | MIT | LICENSE | 有声明和内嵌文件 |
| `new-moon-2.5.0.zip` | `new-moon` | `2.5.0` | MIT | LICENSE | 有声明和内嵌文件 |
| `new-one-dark-theme-1.2.1.zip` | `new-one-dark-theme` | `1.2.1` | MIT | one-dark-theme-for-brackets/LICENSE | 有声明和内嵌文件 |
| `nord-brackets-0.1.0.zip` | `nord-brackets` | `0.1.0` | (Apache-2.0 AND CC-BY-SA-4.0) | LICENSE.md | 有声明和内嵌文件 |
| `quick-dark-1.1.6.zip` | `quick-dark` | `1.1.6` | MIT | 未找到 | 待补许可证文本 |
| `rain.monokai-dark-soda-1.0.9.zip` | `rain.monokai-dark-soda` | `1.0.9` | MIT | 未找到 | 待补许可证文本 |
| `raven-1.0.7.zip` | `raven` | `1.0.7` | MIT | raven/LICENSE | 有声明和内嵌文件 |
| `response-for-brackets-0.1.0.zip` | `response-for-brackets` | `0.1.0` | 未声明 | 未找到 | 待确认：两者均缺失 |
| `samaneyaghoobi.innovit-1.0.2.zip` | `samaneyaghoobi.innovit` | `1.0.2` | MIT | innovit/LICENSE.md | 有声明和内嵌文件 |
| `stripper-theme-0.1.1.zip` | `stripper-theme` | `0.1.1` | MIT | Brackets-Stripper-master/LICENSE | 有声明和内嵌文件 |
| `sweet-dark-1.0.3.zip` | `sweet-dark` | `1.0.3` | MIT | sweet-dark-master/LICENSE | 有声明和内嵌文件 |
| `swmitra.html-designer-2.0.6.zip` | `swmitra.html-designer` | `2.0.6` | MIT | html-designer-master/LICENSE<br>html-designer-master/lib/bootstrap-colorpicker/LICENSE<br>html-designer-master/lib/jQuery-Knob/LICENSE | 有声明和内嵌文件 |
| `talmand.html-templates-1.3.5.zip` | `talmand.html-templates` | `1.3.5` | 未声明 | 未找到 | 待确认：两者均缺失 |
| `themes-2.0.6.zip` | `themes` | `2.0.6` | 未声明 | Brackets-Themes-master/LICENSE | 待核对元数据 |
| `themesforbrackets-2.0.14.zip` | `themesforbrackets` | `2.0.14` | 未声明 | themes-for-brackets-master/LICENSE | 待核对元数据 |
| `visual-studio-dark-1.1.5.zip` | `visual-studio-dark` | `1.1.5` | 未声明 | brackets-visual-studio-dark-master/LICENSE | 待核对元数据 |
| `visual-studio-theme-0.0.1.zip` | `visual-studio-theme` | `0.0.1` | 未声明 | VisualStudio-master/LICENSE | 待核对元数据 |

“有声明和内嵌文件”只表示自动检查找到了两类信息，并不保证许可证文本、包版本、版权人和注册表来源完全一致。正式发布前仍应对照原始来源抽查，并在升级扩展后重新生成本清单。
