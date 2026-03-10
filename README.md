# Fullstack Agent Skill

bộ 5 skill cho fullstack developer:

- API + backend admin: api-admin-platform
- Database design/migration/rollout: database-delivery
- CI/CD với GitHub Actions: github-actions-cicd
- Infra bằng Terraform: terraform-platform-infra
- Bootstrap repo đa ngôn ngữ: polyglot-stack-bootstrap

## Usage:

Trong từng repo dự án tạo File `AGENTS.md` để hướng dẫn agent cách dùng skill

### Copilot

Với copilot thì chưa có cách để cài skill theo kiểu global giống codex. Nên có thể sử dụng "Local Symlink" (Dành riêng cho môi trường VS Code)

- Clone repo về máy local
- Dùng script tự động tạo link trong mỗi dự án mới:

```Bash
ln -s ~/[Path-to-repo]/personal-fullstack-agent-skill/skills .github/skills
```
