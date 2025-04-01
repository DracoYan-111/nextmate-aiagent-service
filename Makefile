REGISTRY := swr.la-north-2.myhuaweicloud.com/nextmate
TARGET := aiagent-backend
ENV := dev
VERSION ?= $(shell git rev-parse --short HEAD)

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    SED := sed -i ''
else
    SED := sed -i
endif

.PHONY: docker-build
docker-build:
	docker build -f Dockerfile -t $(REGISTRY)/$(TARGET):$(ENV)-$(VERSION) -t $(REGISTRY)/$(TARGET):$(ENV)-latest .

.PHONY: docker-build-dev
docker-build-dev:
	make docker-build ENV=dev

.PHONY: docker-build-prod
docker-build-prod:
	make docker-build ENV=prod

.PHONY: docker-push
docker-push:
	docker push $(REGISTRY)/$(TARGET):$(ENV)-$(VERSION)
	docker push $(REGISTRY)/$(TARGET):$(ENV)-latest

.PHONY: docker-push-dev
docker-push-dev:
	make docker-push ENV=dev

.PHONY: docker-push-prod
docker-push-prod:
	make docker-push ENV=prod