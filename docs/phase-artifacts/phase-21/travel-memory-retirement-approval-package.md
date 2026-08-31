# Phase 21 Travel Memory retirement approval package

狀態：BLOCKED — approval package only；未批准 Production migration/destructive cleanup

候選欄位：`dailyHighlights`、`itineraryImages`、已搬入 placements 的 `galleryImages`、重複 parent video/reminder，以及待 inventory 的 `Media.relatedMembers`／`relatedTravelRecord`。

## 執行前必須全部通過

1. Fresh Production read inventory：row/relationship/locales/version counts與 non-null samples。
2. Repository consumer search證明 zero canonical runtime reads；legacy fallback 已切除並完成 observation window。
3. 每筆資料都有 canonical destination identity；Admin-only edits、missing Base、unmapped/duplicate media為零。
4. Generated UP/DOWN 只含批准 targets，無 CASCADE、無其他 collection、無 content rewrite。
5. Disposable database完成 up → read-back → down → read-back → up。
6. Schema migration、content migration、media write、deploy與 cleanup各自批准。
7. Production inventory與批准 hash完全一致；部署 commit與 executor HEAD一致。

任一 gate 失敗：立即 BLOCK，保留證據；不 apply、不重試、不接受 drift。Phase 21 不包含 Production cleanup。
