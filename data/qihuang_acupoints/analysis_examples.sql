-- 在 SQLite 中运行：sqlite3 acupoints.sqlite < analysis_examples.sql

-- 1. 每条经脉的穴位数量
SELECT meridian, COUNT(*) AS acupoint_count
FROM acupoints
GROUP BY meridian
ORDER BY acupoint_count DESC, meridian;

-- 2. 查找正文中提到“咳嗽”的穴位和对应分节
SELECT a.point_id, a.name, a.meridian, s.heading, s.text
FROM acupoints AS a
JOIN sections AS s USING (point_id)
WHERE s.text LIKE '%咳嗽%'
ORDER BY a.point_id, s.section_order;

-- 3. 取得穴位图的本地相对路径
SELECT point_id, name, image_local_path
FROM acupoints
ORDER BY point_id;
