# Fail during importing the file (not running).

foo = {}
bar.x = 0

exports.init = (T, cb) ->
  T.waypoint "will not even go this far"
  cb null

exports.test1 = (T, cb) ->
  T.error "This will not be ran either."
  cb null
