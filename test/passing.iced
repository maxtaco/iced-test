# a file in which everything passes

file = "passing.iced"

exports.init = (T, cb) ->
  T.waypoint "ran init for #{file}"
  cb null

exports.t1 = (T, cb) ->
  T.waypoint "t1 waypoint"
  await setTimeout defer(), 1
  cb null

exports.t2 = (T, cb) ->
  await setTimeout defer(), 1
  T.waypoint "t2 waypoint, doesn't matter"
  cb null

exports.destroy = (T, cb) ->
  T.waypoint "and still ran the destructor for #{file}"
  cb null
