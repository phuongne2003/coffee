# BrewDesk Test Checklist (Regression)

Ngay test: \_**\_ / \_\_** / **\_\_**
Nguoi test: ********\_\_\_\_********
Build/Commit: ********\_\_\_\_********
Moi truong: local / staging / prod

## 1) Environment And Smoke

- [ ] BE start thanh cong
- [ ] FE start thanh cong
- [ ] DB ket noi thanh cong
- [ ] Dang nhap manager thanh cong
- [ ] Dang nhap staff thanh cong
- [ ] Trang Dashboard mo duoc
- [ ] Trang Categories mo duoc
- [ ] Trang Ingredients mo duoc
- [ ] Trang Menu Items mo duoc
- [ ] Trang Tables mo duoc
- [ ] Trang Orders mo duoc
- [ ] Mobile menu theo table code mo duoc

## 2) Auth And Role

- [ ] Register hop le tao user thanh cong
- [ ] Login sai mat khau tra loi dung
- [ ] Token het han bi yeu cau dang nhap lai
- [ ] Customer khong vao duoc trang quan tri
- [ ] Staff khong goi duoc API manager only
- [ ] Request khong token bi chan dung ma loi

## 3) Categories

- [ ] Tao danh muc moi
- [ ] Sua danh muc
- [ ] Tim kiem danh muc
- [ ] Bat/Tat danh muc
- [ ] Reorder danh muc
- [ ] Xoa danh muc
- [ ] Xac nhan hanh vi hien tai: xoa danh muc se xoa cac mon thuoc danh muc

## 4) Ingredients

- [ ] Tao nguyen lieu
- [ ] Sua nguyen lieu
- [ ] Cap nhat ton kho type=in
- [ ] Cap nhat ton kho type=out
- [ ] Cap nhat ton kho type=adjustment
- [ ] Canh bao low stock hien thi dung
- [ ] Lich su xuat/nhap hien thi ly do
- [ ] Lich su xuat/nhap hien thi don hang lien quan

## 5) Menu Items

- [ ] Tao mon moi voi recipe hop le
- [ ] Upload anh jpg/png/webp thanh cong
- [ ] Upload anh qua lon bi chan voi thong bao ro rang
- [ ] Sua mon
- [ ] Bat/Tat trang thai ban
- [ ] Xoa mon
- [ ] Anh card nam gon trong khung, khong bi phong to/cat le

## 6) Tables

- [ ] Tao ban moi
- [ ] Sua ban
- [ ] Bat/Tat ban
- [ ] Loc Dang bat/Da tat dung ket qua
- [ ] Xoa ban
- [ ] Polling trang Tables khong gay nhay UI
- [ ] Tao order tren ban => ban chuyen occupied
- [ ] Order paid => ban tu dong ve available

## 7) Orders POS

- [ ] Tao order POS
- [ ] Them mon vao order
- [ ] Cap nhat so luong mon trong order
- [ ] Chuyen ban cho order
- [ ] Chuyen status pending -> preparing
- [ ] Chuyen status preparing -> served
- [ ] Chuyen status served -> paid
- [ ] Kiem tra tru ton kho xay ra o preparing
- [ ] Xoa order va cap nhat trang thai ban dung

## 8) Mobile Ordering

- [ ] Vao menu theo tableCode hop le
- [ ] Loc mon theo danh muc
- [ ] Them mon vao gio
- [ ] Dat mon thanh cong
- [ ] Hien thi xac nhan don (ma don + ban)
- [ ] Khong dat duoc don voi du lieu khong hop le

## 9) Reports

- [ ] Summary tra ve so lieu hop le
- [ ] By-category dung theo danh muc
- [ ] Trend dung theo khoang thoi gian
- [ ] Inventory report khop ton kho thuc te

## 10) Error Handling

- [ ] Backend down => FE hien thong bao loi de hieu
- [ ] Payload qua lon => API tra 413 + thong bao ro rang
- [ ] Validation loi => hien dung thong diep loi
- [ ] Khong phat sinh 500 o cac thao tac thong dung

## 11) Test Result Summary

Tong testcase: **\_\_**
Pass: **\_\_**
Fail: **\_\_**
Blocked: **\_\_**

Loi blocker/critical:

- ***
- ***

Loi can theo doi:

- ***
- ***

Ket luan:

- [ ] PASS regression
- [ ] FAIL regression

Nguoi xac nhan: ********\_\_\_\_********
Ngay: \_**\_ / \_\_** / **\_\_**
