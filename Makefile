ARCH ?= $(if $(filter $(shell uname -m),x86_64),amd64,arm64)
VERSION ?= $(shell git rev-parse --short HEAD)
BUILD ?= $(shell date +%Y%m%d%H%M%S)
RUNNER ?= gcr.io/distroless/base-debian12:nonroot
BUF := buf
GCI := gci
DOCKER := docker
MAKE := make
REGISTRY := swr.la-north-2.myhuaweicloud.com/nextmate


