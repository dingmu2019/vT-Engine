# 快速部署指南 (Docker)

本应用已配置为使用 Docker Compose 进行一键部署。

## 前置条件

确保你的机器上已安装：
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 部署步骤

1. **构建并启动服务**
   在项目根目录下运行：
   ```bash
   docker-compose up -d --build
   ```

2. **访问应用**
   - 前端应用：http://localhost
   - 后端 API：http://localhost:3001/api

3. **停止服务**
   ```bash
   docker-compose down
   ```

## 配置说明

- **前端端口**：默认为 `80`。如需修改，请编辑 `docker-compose.yml` 中的 `frontend` 服务端口映射。
- **后端环境变量**：后端服务会自动读取 `server/.env` 文件中的配置。
