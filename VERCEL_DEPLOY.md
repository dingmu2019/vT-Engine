# Vercel 部署指南

本应用已配置为支持 Vercel 部署（前端 + 后端 Serverless）。

## 部署步骤

1. **推送到 Git 仓库**
   将本项目代码推送到 GitHub、GitLab 或 Bitbucket。

2. **在 Vercel 中导入项目**
   - 登录 Vercel。
   - 点击 "Add New..." -> "Project"。
   - 选择你的 Git 仓库。

3. **配置项目**
   - **Framework Preset**: Vercel 会自动检测为 Vite，通常无需修改。
   - **Root Directory**: 保持默认 `./`。
   - **Build Command**: `npm run build` (默认)。
   - **Output Directory**: `dist` (默认)。

4. **设置环境变量 (Environment Variables)**
   在部署页面的 "Environment Variables" 区域，添加以下变量：

   | 变量名 | 说明 | 示例值 |
   | :--- | :--- | :--- |
   | `SUPABASE_URL` | Supabase 项目 URL | `https://xyz.supabase.co` |
   | `SUPABASE_KEY` | Supabase Anon Key | `eyJ...` |
   | `GEMINI_API_KEY` | (可选) AI 功能 Key | `AIza...` |

   > **注意**：如果未设置 `SUPABASE_URL`，系统将自动回退到**内存模拟数据模式**，您可以正常浏览应用，但数据不会持久化保存。

5. **点击 Deploy**
   等待部署完成。

## 架构说明

- **前端**: 部署为静态资源 (Vite Build)。
- **后端**: 部署为 Serverless Functions。
- **路由**: `vercel.json` 配置了路由重写：
  - `/api/*` 请求会被转发到 `api/index.ts` (Express App)。
  - 其他请求由前端处理。

## 本地开发

本地开发依然可以使用 `npm run dev` (前端) 和 `npm run start` (后端，在 server 目录下)。
或者使用 `vercel dev` 命令（需安装 Vercel CLI）来模拟生产环境路由。
