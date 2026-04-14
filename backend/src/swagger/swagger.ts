import swaggerJSDoc from "swagger-jsdoc";
import { env } from "../config/env";

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Coffee POS API",
    version: "1.0.0",
    description: "Tài liệu API backend cho Coffee POS và Mobile Order.",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Máy chủ local",
    },
  ],
  tags: [
    { name: "Auth", description: "Các endpoint xác thực" },
    { name: "Categories", description: "Quản lý danh mục món ăn" },
    { name: "Ingredients", description: "Quản lý nguyên liệu và tồn kho" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "manager@gmail.com",
          },
          password: { type: "string", example: "Password123" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["fullName", "email", "password"],
        properties: {
          fullName: { type: "string", example: "Nguyễn Văn A" },
          email: {
            type: "string",
            format: "email",
            example: "customer@gmail.com",
          },
          password: { type: "string", example: "Password123" },
          role: {
            type: "string",
            enum: ["customer", "staff", "manager"],
            example: "manager",
            description:
              "Vai trò khi đăng ký để test; cho phép tạo tạm thời tài khoản quản lý",
          },
        },
      },
      IngredientRequest: {
        type: "object",
        required: ["name", "unit"],
        properties: {
          name: { type: "string", example: "Sữa tươi" },
          unit: { type: "string", example: "ml" },
          currentStock: { type: "number", example: 1000 },
          alertThreshold: { type: "number", example: 200 },
          description: { type: "string", example: "Sữa tươi dùng cho latte" },
        },
      },
      IngredientStockRequest: {
        type: "object",
        required: ["type", "quantity"],
        properties: {
          type: {
            type: "string",
            enum: ["in", "out", "adjustment"],
            example: "in",
          },
          quantity: { type: "number", example: 500 },
          note: { type: "string", example: "Nhập thêm từ nhà cung cấp" },
        },
      },
      CategoryRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Coffee" },
          description: {
            type: "string",
            example: "Các món cà phê nóng và lạnh",
          },
          isActive: { type: "boolean", example: true },
          sortOrder: { type: "number", example: 1 },
        },
      },
      CategoryToggleRequest: {
        type: "object",
        required: ["isActive"],
        properties: {
          isActive: { type: "boolean", example: false },
        },
      },
      CategoryReorderRequest: {
        type: "object",
        required: ["items"],
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "sortOrder"],
              properties: {
                id: { type: "string", example: "6618f20d3d80dd8f0d7ce114" },
                sortOrder: { type: "number", example: 2 },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập bằng email và mật khẩu",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Đăng nhập thành công" },
          "401": { description: "Email hoặc mật khẩu không đúng" },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Đăng ký thành công" },
          "409": { description: "Email đã được sử dụng" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Lấy thông tin người dùng hiện tại",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Thông tin người dùng hiện tại" },
          "401": { description: "Chưa được xác thực" },
        },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "Lấy danh sách danh mục",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Danh sách danh mục" },
          "401": { description: "Chưa được xác thực" },
        },
      },
      post: {
        tags: ["Categories"],
        summary: "Tạo danh mục mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoryRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Tạo danh mục thành công" },
          "403": { description: "Không có quyền truy cập" },
          "409": { description: "Danh mục đã tồn tại" },
        },
      },
    },
    "/api/categories/reorder": {
      patch: {
        tags: ["Categories"],
        summary: "Cập nhật thứ tự hiển thị danh mục",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoryReorderRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Cập nhật thứ tự thành công" },
          "403": { description: "Không có quyền truy cập" },
          "404": { description: "Danh mục không tồn tại" },
        },
      },
    },
    "/api/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Lấy chi tiết danh mục",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Chi tiết danh mục" },
          "404": { description: "Không tìm thấy danh mục" },
        },
      },
      patch: {
        tags: ["Categories"],
        summary: "Cập nhật danh mục",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoryRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Cập nhật danh mục thành công" },
          "403": { description: "Không có quyền truy cập" },
          "404": { description: "Không tìm thấy danh mục" },
          "409": { description: "Tên danh mục đã tồn tại" },
        },
      },
      delete: {
        tags: ["Categories"],
        summary: "Xóa danh mục (soft delete)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Xóa danh mục thành công" },
          "403": { description: "Không có quyền truy cập" },
          "404": { description: "Không tìm thấy danh mục" },
        },
      },
    },
    "/api/categories/{id}/toggle": {
      patch: {
        tags: ["Categories"],
        summary: "Bật hoặc tắt danh mục",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CategoryToggleRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Cập nhật trạng thái danh mục thành công" },
          "403": { description: "Không có quyền truy cập" },
          "404": { description: "Không tìm thấy danh mục" },
        },
      },
    },
    "/api/ingredients": {
      get: {
        tags: ["Ingredients"],
        summary: "Lấy danh sách nguyên liệu",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Danh sách nguyên liệu" },
          "401": { description: "Chưa được xác thực" },
          "403": { description: "Không có quyền truy cập" },
        },
      },
      post: {
        tags: ["Ingredients"],
        summary: "Tạo nguyên liệu mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IngredientRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Tạo nguyên liệu thành công" },
          "409": { description: "Nguyên liệu đã tồn tại" },
        },
      },
    },
    "/api/ingredients/alerts/low-stock": {
      get: {
        tags: ["Ingredients"],
        summary: "Lấy danh sách nguyên liệu sắp hết",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Danh sách nguyên liệu sắp hết" },
        },
      },
    },
    "/api/ingredients/{id}": {
      get: {
        tags: ["Ingredients"],
        summary: "Lấy chi tiết nguyên liệu",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Chi tiết nguyên liệu" },
          "404": { description: "Không tìm thấy nguyên liệu" },
        },
      },
      patch: {
        tags: ["Ingredients"],
        summary: "Cập nhật nguyên liệu",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IngredientRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Cập nhật nguyên liệu thành công" },
          "404": { description: "Không tìm thấy nguyên liệu" },
        },
      },
      delete: {
        tags: ["Ingredients"],
        summary: "Xóa nguyên liệu",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Xóa nguyên liệu thành công" },
          "404": { description: "Không tìm thấy nguyên liệu" },
        },
      },
    },
    "/api/ingredients/{id}/stock": {
      patch: {
        tags: ["Ingredients"],
        summary: "Cập nhật tồn kho nguyên liệu",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IngredientStockRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Cập nhật tồn kho thành công" },
          "400": { description: "Dữ liệu không hợp lệ" },
          "404": { description: "Không tìm thấy nguyên liệu" },
        },
      },
    },
    "/api/ingredients/{id}/movements": {
      get: {
        tags: ["Ingredients"],
        summary: "Lấy lịch sử biến động kho của nguyên liệu",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Lịch sử biến động kho" },
          "404": { description: "Không tìm thấy nguyên liệu" },
        },
      },
    },
  },
};

const options: swaggerJSDoc.Options = {
  definition: swaggerDefinition,
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(options);
