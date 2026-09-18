# agents-doc/ — tài liệu vận hành cho người và agent

> Trạng thái: ACTIVE · Bản đồ "đọc gì, khi nào, phần nào" nằm ở `AGENTS.md` §3 — không lặp lại ở đây.

```text
agents-doc/
├── spec.md            # Spec sản phẩm & kiến trúc — nguồn sự thật DUY NHẤT (đọc theo §)
├── plans/             # Kế hoạch thực thi theo phase: step có checkbox, I/O, test, gate
│   ├── README.md      # quy ước chung + bảng phase/gate
│   └── _template-phase.md
├── decisions/         # Một file = một quyết định (MADR 4.0.0); README.md = index SINH TỰ ĐỘNG
│   ├── _template.md
│   └── NNNN-<id>-<slug>.md
└── handoff/           # Một file = một phiên làm việc của một agent
    ├── README.md
    └── YYYY-MM-DD-HHMM-<agent>-<slug>.md
```

Tài liệu thiết kế kỹ thuật chi tiết theo stack (schema/ERD, contract API/RPC, runbook) đặt thêm tại đây theo tên rõ nghĩa (vd `database-erd.md`, `api-contracts.md`) và khai vào bảng `AGENTS.md` §3 để agent biết **đọc khi nào, phần nào**.
