# Contributing

## Setup

Requirements: Node.js 20+ and npm.

```shell
git clone https://github.com/damelm/hamsket.git
cd hamsket
npm install
npm run dev
```

## Before opening a PR

```shell
npm run typecheck
npm run lint
npm run test
```

All three must pass — CI runs the same checks.

## Adding or editing a service

See the ["Adding or editing a service"](./README.md#adding-or-editing-a-service) section of the README.

## Branching

Branch off `main`, name it `fix/xxx` or `feature/xxx`, open a PR against `main`.
