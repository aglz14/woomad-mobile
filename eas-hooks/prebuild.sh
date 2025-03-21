#!/bin/bash

# Apply patches
cd $PREBUILD_COMMAND_CWD
npm run postinstall

# Fix Folly Coroutine.h issue
if [ -d "ios" ]; then
  cd ios
  if [ -d "Pods/Folly" ]; then
    COROUTINE_H_PATH="Pods/Folly/folly/experimental/coro/Coroutine.h"
    if [ ! -f "$COROUTINE_H_PATH" ]; then
      mkdir -p "Pods/Folly/folly/experimental/coro"
      echo "#pragma once
#include <utility>
namespace folly {
namespace coro {
namespace detail {
template <typename T>
struct coroutine_traits {};
}  // namespace detail
}  // namespace coro
}  // namespace folly" > "$COROUTINE_H_PATH"
      echo "Created missing Coroutine.h file"
    fi
  fi
fi 