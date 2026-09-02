# Momcozy Air 2 Fit & Leak Detection Demo

独立静态 H5 Demo，不修改或依赖原 Air 2 项目运行目录。

## Fit Check

点击 `Start Pumping` 后依次检测：

1. Battery
2. Posture
3. Alignment
4. Suction

正常分支在 5 秒后通过并开始吸奶。打开右下角 `Triggers`，可将 `Fit Check result` 切换成 `Severe leak`，此时检测结束后进入两页漏气排查视频。

## 吸奶中漏气

- `Air leak`：严重漏气，自动暂停并在会话上方显示提醒。点击提醒打开漏气排查；关闭提醒或排查页后，可用右下角按钮恢复吸奶。
- `Minor leak`：记录为轻微漏气，不中断当前吸奶。

## 吸奶结束

- 无漏气：Log Pumping Amount → Logged。
- 轻微漏气：记录奶量 → 轻微漏气结果 → Leak troubleshooting 第 1、2 页。
- 严重漏气：记录奶量页显示带下划线的 `Leak troubleshooting`，点击进入第 1、2 页。

所有新增页面均有关闭按钮，可随时退出。

## 素材

- `assets/leak-check/step-1-cup-check.mp4`
- `assets/leak-check/step-2-fit-check.mp4`

## 本地运行

```powershell
python -m http.server 4185
```

访问 `http://127.0.0.1:4185/`。
