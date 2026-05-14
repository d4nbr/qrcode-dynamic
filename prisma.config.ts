import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://docker:docker@localhost:5433/qrcode_dynamic',
  },
})
