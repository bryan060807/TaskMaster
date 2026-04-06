FROM docker.io/library/nginx:latest
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html
COPY build/client/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
