ARG DOCKER_IMAGE
ARG YARN_TOKEN
FROM ${DOCKER_IMAGE}
WORKDIR /app
ENV YARN_TOKEN=$YARN_TOKEN
COPY package.json yarn.lock .yarnrc.yml ./
COPY node_modules ./node_modules
COPY dist ./dist
COPY infra/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]