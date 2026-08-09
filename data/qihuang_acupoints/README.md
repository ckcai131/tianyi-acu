# 岐黄穴位信息库

来源：qihuang.vip「经络腧穴（针灸穴位数据库）」；采集时以每条记录的 `source_url` 和 `fetched_at_utc` 为准。

- `acupoints.sqlite`：推荐用于 SQL / Python 分析；`acupoints` 为每穴一行，`sections` 为正文分段。
- `acupoints.json`：完整嵌套记录，适合程序读取。
- `acupoints.csv`：便于 Excel 预览；正文分段位于 `sections_json`。
- `images/`：各穴位详情页的定位图，文件名前缀与 `point_id` 对应。

正文保留了该网站当前公开展示的内容；页面中因登录而未展示的后续内容不会被推断或补全。医疗使用请以专业人员判断为准。
