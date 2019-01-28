fs = require 'fs'
path = require 'path'
deep_equal = require 'deep-equal'
colors = require 'colors'

CHECK = "\u2714"
BAD_X = "\u2716"
WAYPOINT = "\u2611"

##-----------------------------------------------------------------------

sort_fn = (a,b) ->
  if (m1 = a.match /^(\d+)_/)? and (m2 = b.match /^(\d+)_/)?
    parseInt(m1[1]) - parseInt(m2[1])
  else a.localeCompare(b)

##-----------------------------------------------------------------------

get_relevant_stack_frames = (filepath, err) ->
  stacklines = (err ? new Error()).stack.split('\n').slice(1)
  ret = []
  # If we have test file path, try to find first stack line with that path.
  if filepath
    lines = stacklines.filter (x) -> x.indexOf(filepath) isnt -1
    ret.push s1 if (s1 = lines?[0]?.trim())

  # Also try to find first frame outside of iced-test
  if module?.filename
    lines = stacklines.filter (x) -> x.indexOf(module.filename) is -1
    ret.unshift s2 if (s2 = lines?[0]?.trim()) and s2 isnt s1

  return ret

format_stack_frame_str = (filepath, err) ->
  ret = get_relevant_stack_frames filepath, err
  if ret.length
    return ret.join('\n or ')
  else
    return err?.stack

##-----------------------------------------------------------------------

exports.File = class File
  constructor : (@name, @runner) ->
  new_case : () -> return new Case @
  default_init : (cb) -> cb true
  default_destroy : (cb) -> cb true
  test_error_message : (m) -> @runner.test_error_message m
  waypoint : (m) -> @runner.waypoint m

##-----------------------------------------------------------------------

exports.Case = class Case

  ##-----------------------------------------

  constructor : (@file) ->
    @_ok = true

  ##-----------------------------------------

  search : (s, re, msg) ->
    @assert (s? and s.search(re) >= 0), msg

  ##-----------------------------------------

  assert : (f, what) ->
    if not f
      @error "Assertion failed: #{what}"
      @_ok = false

  ##-----------------------------------------

  equal : (a,b,what) ->
    if not deep_equal a, b
      [ja, jb] = [JSON.stringify(a), JSON.stringify(b)]
      @error "In #{what}: #{ja} != #{jb}"
      @_ok = false

  ##-----------------------------------------

  error : (e) ->
    if stackline = format_stack_frame_str @file?.runner?._cur_file_path
      e = "#{e} (#{stackline})"
    @file.test_error_message e
    @_ok = false

  ##-----------------------------------------

  no_error : (e) ->
    if e?
      @error e.toString()
      @_ok = false

  ##-----------------------------------------

  esc : (cb_good, cb_bad, msg) ->
    (err, args...) =>
      if err?
        @error (if msg? then (msg + ": ") else "") + err.toString()
        @_ok = false
        cb_bad()
      else
        cb_good args...

  ##-----------------------------------------

  make_esc : (cb_bad, msg) => (cb_good) => @esc cb_good, cb_bad, msg

  ##-----------------------------------------

  is_ok : () -> @_ok

  ##-----------------------------------------

  waypoint : (m) -> @file.waypoint m


##-----------------------------------------------------------------------

class Runner

  ##-----------------------------------------

  constructor : ->
    @_files = []
    @_launches = 0
    @_tests = 0
    @_successes = 0
    @_rc = 0
    @_n_files = 0
    @_n_good_files = 0

    @_file_states = {} # filename -> true (passed) / false (failed)
    @_failures = []

  ##-----------------------------------------

  run_files : (cb) ->
    for f in @_files
      await @run_file f, defer()
    cb()

  ##-----------------------------------------

  new_file_obj : (fn) -> new File fn, @

  ##-----------------------------------------

  run_test_case_guarded : (code, case_obj, gcb) ->
    remove_uncaught = () ->
    timeoutObj = null
    cb_called = false
    cb = () =>
      if timeoutObj
        clearTimeout(timeoutObj)
        timeoutObj = null

      unless cb_called
        cb_called = true
        remove_uncaught()
        gcb.apply @, arguments

    format_stack = (err) => format_stack_frame_str @_cur_file_path, err

    if @uncaughtException
      # "On Error Resume Next"
      # This is needed, because otherwise testing is stopped after first
      # failed async test. We want to continue as far as we can, even if in
      # unstable state (test run is considered "failed" from now on anyway).
      remove_uncaught = () -> process.removeAllListeners 'uncaughtException'
      remove_uncaught()
      process.on 'uncaughtException', (err) ->
        console.log ":: Recovering from async exception: #{err}"
        console.log ":: Testing may become unstable from now on."
        console.log format_stack(err)
        cb err

    if @timeoutMs
      timeoutFunc = () ->
        unless cb_called
          console.log ":: Recovering from a timeout in test function."
          console.log ":: Testing may become unstable from now on."
          timeoutObj = null # So `cb` does not clear timeout that just fired.
          cb new Error "timeout"
      timeoutObj = setTimeout timeoutFunc, @timeoutMs

    try
      # If we crash before we hit the main event loop, we have to recover and
      # error out here; otherwise, the error is lost and the program cleanly
      # terminates.
      code case_obj, cb
    catch err
      console.log ":: Caught sync exception: #{err}"
      console.log format_stack(err)
      cb err

  run_code : (fn, code, cb) ->
    fo = @new_file_obj fn

    if code.init?
      await @run_test_case_guarded code.init, fo.new_case(), defer err
    else
      await fo.default_init defer ok
      err = "failed to run default init" unless ok

    destroy = code.destroy
    delete code["init"]
    delete code["destroy"]

    @_n_files++
    hit_any_error = false
    if err
      @err "Failed to initialize file #{fn}: #{err}"
      hit_any_error = true
    else
      @_n_good_files++
      for k,func of code
        @_tests++
        C = fo.new_case()
        hit_error = false

        await @run_test_case_guarded func, C, defer err

        if err
          @err "In #{fn}/#{k}: #{err}"
          hit_error = true
          hit_any_error = true

        if C.is_ok() and not hit_error
          @_successes++
          @report_good_outcome "#{CHECK} #{fn}: #{k}"
        else
          @report_bad_outcome outcome = "#{BAD_X} TESTFAIL #{fn}: #{k}"
          @_failures.push outcome

    if destroy?
      await @run_test_case_guarded destroy, fo.new_case(), defer err
    else
      await fo.default_destroy defer()

    @_file_states[fn] = not hit_any_error and not err

    cb err

  ##-----------------------------------------

  report : () ->
    if @_rc < 0
      @err "#{BAD_X} Failure due to test configuration issues"
    @_rc = -1 unless @_tests is @_successes

    opts = if @_rc is 0 then { green : true } else { red : true }
    opts.bold = true

    @log "Tests: #{@_successes}/#{@_tests} passed", opts

    if @_n_files isnt @_n_good_files
      @err " -> Only #{@_n_good_files}/#{@_n_files} files ran properly", { bold : true }

    if (file_failures = (k for k,v of @_file_states when not v)).length
      @log "Failed in files (pass as arguments to runner to retry):", { red : true }
      @log "  " + file_failures.join(' '), {}
      @log "", {}
    return @_rc

  ##-----------------------------------------

  err : (e, opts = {}) ->
    opts.red = true
    @log e, opts
    @_rc = -1

  ##-----------------------------------------

  waypoint : (txt) ->
    @log "  #{WAYPOINT} #{txt}", { green : true }
  report_good_outcome : (txt) ->
    @log txt, { green : true }
  report_bad_outcome : (txt) ->
    @log txt, { red : true, bold : true }
  test_error_message : (txt) ->
    @log "- #{txt}", { red : true }

  ##-----------------------------------------

  init : (cb) -> cb true
  finish : (cb) -> cb true

  ##-----------------------------------------

##-----------------------------------------------------------------------

exports.ServerRunner = class ServerRunner extends Runner

  ##-----------------------------------------

  constructor : () ->
    super()

  ##-----------------------------------------

  run_file : (f, cb) ->
    try
      m = path.resolve @_dir, f
      dat = require m
      @_cur_file_path = m
      await @run_code f, dat, defer() unless dat.skip?
    catch e
      @err "When importing test file '#{f}' (not running tests yet):"
      @err "In reading #{m}: #{e}\n#{e.stack}"
      # Still consider this file as attempted, so it gets listed
      # in the report after testing.
      @_file_states[f] = false
      @_n_files++
      # Iced miscompilation workaround - if ended up in the catch block,
      # it wouldn't exit it to call cb. So we call it again here, but do
      # return as well for when the iced bug is fixed.
      return cb e
    cb()

  ##-----------------------------------------

  log : (msg, { green, red, bold })->
    # Note: all of this works with 'colors' package altering `String` prototype
    msg = msg.green if green
    msg = msg.bold if bold
    msg = msg.red if red
    console.log msg

  ##-----------------------------------------

  load_files : ({mainfile, whitelist, files_dir}, cb) ->

    wld = null
    if whitelist?
      wld = {}
      wld[k] = true for k in whitelist

    @_dir = path.dirname mainfile
    @_dir = path.join @_dir, files_dir if files_dir?
    base = path.basename mainfile
    await fs.readdir @_dir, defer err, files
    if err?
      ok = false
      @err "In reading #{@_dir}: #{err}"
    else
      ok = true
      re = /.*\.(iced|coffee)$/
      for file in files when file.match(re) and (file isnt base) and (not wld? or wld[file])
        @_files.push file
      @_files.sort sort_fn
    cb ok

  #-------------------------------------

  report_good_outcome : (msg) -> console.log msg.green
  report_bad_outcome  : (msg) -> console.log msg.bold.red

  ##-----------------------------------------

  run : (opts, cb) ->
    await @init defer ok
    await @load_files opts, defer ok  if ok
    await @run_files defer() if ok
    @report()
    await @finish defer ok
    cb @_rc

##-----------------------------------------------------------------------

$ = (m) -> window?.document?.getElementById(m)

##-----------------------------------------------------------------------

exports.BrowserRunner = class BrowserRunner extends Runner

  constructor : (@divs) ->
    super()

  ##-----------------------------------------

  log : (m, {red, green, bold}) ->
    style =
      margin : "0px"
    style.color = "green" if green
    style.color = "red" if red
    style["font-weight"] = "bold" if bold
    style_tag = ("#{k}: #{v}" for k,v of style).join "; "
    tag = "<p style=\"#{style_tag}\">#{m}</p>\n"
    $(@divs.log).innerHTML += tag

  ##-----------------------------------------

  run : (modules, cb) ->
    await @init defer ok
    for k,v of modules when not v.skip
      await @run_code k, v, defer ok
    @report()
    await @finish defer ok
    $(@divs.rc).innerHTML = @_rc
    cb @_rc

##-----------------------------------------------------------------------

exports.run = run = ({mainfile, klass, whitelist, files_dir, runner}) ->
  unless runner?
    klass = ServerRunner unless klass?
    runner = new klass()
  await runner.run { mainfile, whitelist, files_dir }, defer rc
  process.exit rc

##-----------------------------------------------------------------------

exports.main = main = ( {mainfile, files_dir} ) ->
  argv = require('minimist')(process.argv[2...])
  whitelist = if argv._.length > 0 then argv._ else null
  files_dir = "files" unless files_dir?
  run { mainfile, whitelist, files_dir }

##-----------------------------------------------------------------------
