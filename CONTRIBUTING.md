# Contributing

欢迎补充赛事、修正日期或改进界面。这个项目刻意保持“小”：**只收计算机 / 人工智能专业真正会打的赛事**。

## 添加一场赛事

1. 编辑 `index.html` 里的 `EVENTS` 数组，或写一个 `update-feed.js` 补丁。
2. 每场赛事至少包含：

| 字段 | 说明 |
|---|---|
| `id` | 唯一英文 id，小写 + 连字符，例如 `lanqiao2027` |
| `title` / `short` | 完整名称 / 日历短名 |
| `cat` | `ai` / `algo` / `math` / `modeling` / `robot` / `english` / `innovation` / `security` / `engineering` |
| `regStart` / `regEnd` | 报名窗口，`YYYY-MM-DD` |
| `contestStart` / `contestEnd` | 比赛时间，`YYYY-MM-DD` |
| `deadlineText` / `contestText` | 展示给读者的日期文本 |
| `confidence` | `confirmed`（官方已公布）或 `expected`（按往年推算） |
| `route` | `官网直报` / `院校报名` / `学校 / 赛区报名` 等 |
| `source` | `official` / `saikr` / `school` |
| `sourceUrl` | 来源链接（必须是 http/https） |
| `schoolNote` | 通用报名提示：是否需校内选拔、学校统一提交等 |
| `link` | 官方报名 / 赛事主页 |
| `summary` / `why` | 赛事简介 / 为什么值得打 |
| `tips` | 2–3 条备赛建议 |
| `tags` / `schedule` | 展示用标签 / 关键节点 |

3. 日期规则：
   - 官方明确公布到日：`confidence: 'confirmed'`。
   - 只知道月份或按往年推算：`confidence: 'expected'`，并在 `deadlineText` / `schedule` 里写“预计”。
   - 不要为了好看编造精确日期。

4. 来源规则：
   - 优先赛事官网；其次赛氪 / 高校教务处通知。
   - 不收录没有明确主办方的“付费答题 / 付费拿证 / 包获奖”比赛。
   - 不复制赛事 Logo、海报或大段官方文案。

5. 文案规则：
   - 不写学校特定内容；用“本校”描述报名路径。
   - 不写“保研加分”这类绝对承诺；用“各校认定不同，以本校文件为准”。

## PR 检查清单

- [ ] `id` 唯一，日期格式正确。
- [ ] 至少一个 http(s) 来源链接。
- [ ] `confidence` 标注正确。
- [ ] 月历、议程、详情页都能打开。
- [ ] “导出 .ics”能正常生成。
- [ ] 没有加入付费水赛 / 虚假日期 / 学校特定硬编码。

## 本地预览

```bash
# 直接打开
open index.html

# 或起一个静态服务器
python3 -m http.server 8000
# http://localhost:8000
```
