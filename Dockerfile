# Sử dụng image nginx chính thức (phiên bản nhẹ, dựa trên Alpine để giảm kích thước)
FROM nginx:alpine

# Sao chép các file tĩnh (html, css, js) vào thư mục phục vụ của nginx
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

# Mở cổng 8080 (Cloud Run yêu cầu cổng này)
EXPOSE 8080

# Cấu hình nginx để lắng nghe trên cổng 8080
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

# Chạy nginx
CMD ["nginx", "-g", "daemon off;"]