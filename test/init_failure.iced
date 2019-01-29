# Fail in `init` should fail and skip the entire test file.

exports.init = (T, cb) ->
  cb new Error "init failed"

exports.test1 = (T, cb) ->
  T.error "We are not supposed to see these running (1)"
  cb null

exports.test2 = (T, cb) ->
  T.error "We are not supposed to see these running (2)"
  cb null
