ARCH ?= $(if $(filter $(shell uname -m),x86_64),amd64,arm64)
VERSION ?= $(shell git rev-parse --short HEAD)
TARGET ?= aiagent-backend
BUILD ?= $(shell date +%Y%m%d%H%M%S)
RUNNER ?= gcr.io/distroless/base-debian12:nonroot
BUF := buf
GCI := gci
DOCKER := docker
MAKE := make
REGISTRY := swr.la-north-2.myhuaweicloud.com/nextmate


.PHONY: build-aiagent-backend
build-aiagent-backend:
	@$(MAKE) build-target TARGET="aiagent-backend"

.PHONY: docker-build-aiagent-image
docker-build-aiagent-image:
	DOCKER_BUILDKIT=1 $(DOCKER) build \
		--platform linux/$(ARCH) \
		--build-arg VERSION=$(VERSION) \
		--build-arg BUILD=$(BUILD) \
		--build-arg RUNNER=$(RUNNER) \
		-f Dockerfile \
		-t $(REGISTRY)/$(TARGET):$(ARCH)-$(VERSION) \
		-t $(REGISTRY)/$(TARGET):$(ARCH)-latest \
		.


.PHONY: docker-build-aiagent-backend
docker-build-aiagent-backend:
	@$(MAKE) docker-build-aiagent-image TARGET="aiagent-backend" RUNNER="gcr.io/distroless/base-debian12:nonroot"

.PHONY: docker-build-aiagent-amd64
docker-build-aiagent-backend-amd64:
	@$(MAKE) docker-build-aiagent-backend ARCH="amd64"

.PHONY: docker-build-aiagent-arm64
docker-build-aiagent-backend-arm64:
	@$(MAKE) docker-build-aiagent-backend ARCH="arm64"


.PHONY: docker-publish-image
docker-publish-image:
	docker push $(REGISTRY)/$(TARGET):$(ARCH)-$(VERSION)
	docker push $(REGISTRY)/$(TARGET):$(ARCH)-latest

.PHONY: docker-publish-aiagent-backend
docker-publish-aiagent-backend:
	@$(MAKE) docker-publish-image TARGET="aiagent-backend"

.PHONY: docker-publish-aiagent-backend-amd64
docker-publish-aiagent-backend-amd64:
	@$(MAKE) docker-publish-aiagent-backend ARCH="amd64"

.PHONY: docker-publish-aiagent-backend-arm64
docker-publish-aiagent-arm64:
	@$(MAKE) docker-publish-aiagent-backend ARCH="arm64"
