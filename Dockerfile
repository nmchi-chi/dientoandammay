FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/

EXPOSE 8000

RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
