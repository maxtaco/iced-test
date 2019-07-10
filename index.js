// Generated by IcedCoffeeScript 108.0.11
(function() {
  var $, BAD_X, BrowserRunner, CHECK, Case, File, Runner, ServerRunner, WAYPOINT, colors, deep_equal, format_stack_frame_str, fs, get_relevant_stack_frames, iced, main, path, run, runtime_const, sort_fn, util, __iced_k, __iced_k_noop,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  runtime_const = require('iced-runtime')["const"];

  fs = require('fs');

  path = require('path');

  deep_equal = require('deep-equal');

  colors = require('colors');

  util = require('util');

  CHECK = "\u2714";

  BAD_X = "\u2716";

  WAYPOINT = "\u2611";

  sort_fn = function(a, b) {
    var m1, m2;
    if (((m1 = a.match(/^(\d+)_/)) != null) && ((m2 = b.match(/^(\d+)_/)) != null)) {
      return parseInt(m1[1]) - parseInt(m2[1]);
    } else {
      return a.localeCompare(b);
    }
  };

  get_relevant_stack_frames = function(filepath, err) {
    var lines, ret, s1, s2, stacklines, _ref, _ref1;
    stacklines = (err != null ? err : new Error()).stack.split('\n').slice(1);
    ret = [];
    if (filepath) {
      lines = stacklines.filter(function(x) {
        return x.indexOf(filepath) !== -1;
      });
      if ((s1 = lines != null ? (_ref = lines[0]) != null ? _ref.trim() : void 0 : void 0)) {
        ret.push(s1);
      }
    }
    if (typeof module !== "undefined" && module !== null ? module.filename : void 0) {
      lines = stacklines.filter(function(x) {
        return x.indexOf(module.filename) === -1;
      });
      if ((s2 = lines != null ? (_ref1 = lines[0]) != null ? _ref1.trim() : void 0 : void 0) && s2 !== s1) {
        ret.unshift(s2);
      }
    }
    return ret;
  };

  format_stack_frame_str = function(filepath, err) {
    var ret;
    ret = get_relevant_stack_frames(filepath, err);
    if (ret.length) {
      return ret.join('\n or ');
    } else {
      return err != null ? err.stack : void 0;
    }
  };

  exports.File = File = (function() {
    function File(name, runner) {
      this.name = name;
      this.runner = runner;
    }

    File.prototype.new_case = function() {
      return new Case(this);
    };

    File.prototype.default_init = function(cb) {
      return cb(true);
    };

    File.prototype.default_destroy = function(cb) {
      return cb(true);
    };

    File.prototype.test_error_message = function(m) {
      return this.runner.test_error_message(m);
    };

    File.prototype.waypoint = function(m) {
      return this.runner.waypoint(m);
    };

    return File;

  })();

  exports.Case = Case = (function() {
    function Case(file) {
      this.file = file;
      this.make_esc = __bind(this.make_esc, this);
      this._ok = true;
    }

    Case.prototype.search = function(s, re, msg) {
      return this.assert((s != null) && s.search(re) >= 0, msg);
    };

    Case.prototype.assert = function(val, msg) {
      var t;
      if (arguments.length > 2) {
        throw new Error("Invalid assertion: too many arguments, expected at most 2");
      }
      if (msg != null) {
        if ((t = typeof msg) !== "string") {
          throw new Error("Invalid assertion: expected msg of type=string, got " + t + " instead");
        }
        if (deep_equal(val, msg)) {
          throw new Error("Invalid assertion: deep_equal(val,msg) is true, it looks like an attempted T.equal call");
        }
      }
      if (!val) {
        this.error("Assertion failed: " + msg);
        return this._ok = false;
      }
    };

    Case.prototype.equal = function(a, b, msg) {
      var ja, jb, t, _ref;
      if (arguments.length > 3) {
        throw new Error("Invalid equal call: too many arguments, expects at most 3");
      }
      if ((msg != null) && (t = typeof msg) !== "string") {
        throw new Error("Invalid equal call: expected msg to be string, got " + t);
      }
      if (!deep_equal(a, b)) {
        _ref = [JSON.stringify(a), JSON.stringify(b)], ja = _ref[0], jb = _ref[1];
        this.error("In " + msg + ": " + ja + " != " + jb);
        return this._ok = false;
      }
    };

    Case.prototype.error = function(e) {
      var stackline, _ref, _ref1;
      if (stackline = format_stack_frame_str((_ref = this.file) != null ? (_ref1 = _ref.runner) != null ? _ref1._cur_file_path : void 0 : void 0)) {
        e = "" + e + " (" + stackline + ")";
      }
      this.file.test_error_message(e);
      return this._ok = false;
    };

    Case.prototype.no_error = function(e) {
      if (e != null) {
        this.error(e.toString());
        return this._ok = false;
      }
    };

    Case.prototype.esc = function(cb_good, cb_bad, msg) {
      if (typeof cb_good !== 'function') {
        throw new Error("Bad T.esc call: cb_good is not a function");
      } else if (typeof cb_bad !== 'function') {
        throw new Error("Bad T.esc call: cb_bad is not a function");
      } else if ((msg != null) && typeof msg !== 'string') {
        throw new Error("Bad T.esc call: msg is not a string");
      }
      return (function(_this) {
        return function() {
          var C, args, err, tr, where, _ref;
          err = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (err != null) {
            C = runtime_const;
            if (tr = cb_good[C.trace]) {
              where = [tr[C.funcname], "(" + tr[C.filename] + ":" + (tr[C.lineno] + 1) + ")"];
              if (err.istack == null) {
                err.istack = [];
              }
              if ((_ref = err.istack) != null) {
                _ref.push(where.filter(function(x) {
                  return x;
                }).join(' '));
              }
            }
            _this.error((msg != null ? msg + ": " : "") + err.toString());
            return cb_bad(err);
          } else {
            return cb_good.apply(null, args);
          }
        };
      })(this);
    };

    Case.prototype.make_esc = function(cb_bad, msg) {
      return (function(_this) {
        return function(cb_good) {
          return _this.esc(cb_good, cb_bad, msg);
        };
      })(this);
    };

    Case.prototype.is_ok = function() {
      return this._ok;
    };

    Case.prototype.waypoint = function(m) {
      return this.file.waypoint(m);
    };

    return Case;

  })();

  Runner = (function() {
    function Runner() {
      this._files = [];
      this._launches = 0;
      this._tests = 0;
      this._successes = 0;
      this._rc = 0;
      this._n_files = 0;
      this._n_good_files = 0;
      this._file_states = {};
      this._failures = [];
      this._filter_pattern = null;
    }

    Runner.prototype.run_files = function(cb) {
      var f, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          var _i, _len, _ref, _results, _while;
          _ref = _this._files;
          _len = _ref.length;
          _i = 0;
          _while = function(__iced_k) {
            var _break, _continue, _next;
            _break = __iced_k;
            _continue = function() {
              return iced.trampoline(function() {
                ++_i;
                return _while(__iced_k);
              });
            };
            _next = _continue;
            if (!(_i < _len)) {
              return _break();
            } else {
              f = _ref[_i];
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "/home/zapu/Projects/iced-test/index.iced",
                  funcname: "Runner.run_files"
                });
                _this.run_file(f, __iced_deferrals.defer({
                  lineno: 168
                }));
                __iced_deferrals._fulfill();
              })(_next);
            }
          };
          _while(__iced_k);
        });
      })(this)((function(_this) {
        return function() {
          return cb();
        };
      })(this));
    };

    Runner.prototype.new_file_obj = function(fn) {
      return new File(fn, this);
    };

    Runner.prototype.run_test_case_guarded = function(code, case_obj, gcb) {
      var cb, cb_called, err, format_stack, remove_uncaught, timeoutFunc, timeoutObj;
      remove_uncaught = function() {};
      timeoutObj = null;
      cb_called = false;
      cb = (function(_this) {
        return function() {
          if (timeoutObj) {
            clearTimeout(timeoutObj);
            timeoutObj = null;
          }
          if (!cb_called) {
            cb_called = true;
            remove_uncaught();
            return gcb.apply(_this, arguments);
          }
        };
      })(this);
      format_stack = (function(_this) {
        return function(err) {
          return format_stack_frame_str(_this._cur_file_path, err);
        };
      })(this);
      if (this.uncaughtException) {
        remove_uncaught = function() {
          return process.removeAllListeners('uncaughtException');
        };
        remove_uncaught();
        process.on('uncaughtException', function(err) {
          console.log(":: Recovering from async exception: " + err);
          console.log(":: Testing may become unstable from now on.");
          console.log(format_stack(err));
          return cb(err);
        });
      }
      if (this.timeoutMs) {
        timeoutFunc = function() {
          if (!cb_called) {
            console.log(":: Recovering from a timeout in test function.");
            console.log(":: Testing may become unstable from now on.");
            timeoutObj = null;
            return cb(new Error("timeout"));
          }
        };
        timeoutObj = setTimeout(timeoutFunc, this.timeoutMs);
      }
      try {
        return code(case_obj, cb);
      } catch (_error) {
        err = _error;
        console.log(":: Caught sync exception: " + err);
        console.log(format_stack(err));
        return cb(err);
      }
    };

    Runner.prototype.run_code = function(fn, code, cb) {
      var C, destroy, err, fo, func, hit_any_error, k, ok, outcome, st, tof, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      fo = this.new_file_obj(fn);
      (function(_this) {
        return (function(__iced_k) {
          if (code.init != null) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/home/zapu/Projects/iced-test/index.iced",
                funcname: "Runner.run_code"
              });
              _this.run_test_case_guarded(code.init, fo.new_case(), __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return err = arguments[0];
                  };
                })(),
                lineno: 229
              }));
              __iced_deferrals._fulfill();
            })(__iced_k);
          } else {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/home/zapu/Projects/iced-test/index.iced",
                funcname: "Runner.run_code"
              });
              fo.default_init(__iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return ok = arguments[0];
                  };
                })(),
                lineno: 231
              }));
              __iced_deferrals._fulfill();
            })(function() {
              return __iced_k(!ok ? err = "failed to run default init" : void 0);
            });
          }
        });
      })(this)((function(_this) {
        return function() {
          destroy = code.destroy;
          delete code["init"];
          delete code["destroy"];
          _this._n_files++;
          hit_any_error = false;
          (function(__iced_k) {
            if (err) {
              _this.err("Failed to initialize file " + fn + ": " + err);
              return __iced_k(hit_any_error = true);
            } else {
              _this._n_good_files++;
              (function(__iced_k) {
                var _i, _k, _keys, _ref, _results, _while;
                _ref = code;
                _keys = (function() {
                  var _results1;
                  _results1 = [];
                  for (_k in _ref) {
                    _results1.push(_k);
                  }
                  return _results1;
                })();
                _i = 0;
                _while = function(__iced_k) {
                  var _break, _continue, _next;
                  _break = __iced_k;
                  _continue = function() {
                    return iced.trampoline(function() {
                      ++_i;
                      return _while(__iced_k);
                    });
                  };
                  _next = _continue;
                  if (!(_i < _keys.length)) {
                    return _break();
                  } else {
                    k = _keys[_i];
                    func = _ref[k];
                    (function(__iced_k) {
                      if (_this._filter_pattern && !k.match(_this._filter_pattern)) {
                        (function(__iced_k) {
_continue()
                        })(__iced_k);
                      } else {
                        return __iced_k();
                      }
                    })(function() {
                      _this._tests++;
                      C = fo.new_case();
                      (function(__iced_k) {
                        __iced_deferrals = new iced.Deferrals(__iced_k, {
                          parent: ___iced_passed_deferral,
                          filename: "/home/zapu/Projects/iced-test/index.iced",
                          funcname: "Runner.run_code"
                        });
                        _this.run_test_case_guarded(func, C, __iced_deferrals.defer({
                          assign_fn: (function() {
                            return function() {
                              return err = arguments[0];
                            };
                          })(),
                          lineno: 252
                        }));
                        __iced_deferrals._fulfill();
                      })(function() {
                        var _ref1;
                        if (err) {
                          _this.err("In " + fn + "/" + k + ": " + (err.toString()));
                          if ((tof = typeof err) === 'object') {
                            _this.log("Full error object:", {
                              red: true,
                              underline: true
                            });
                            _this.log(util.format(err), {});
                            if ((_ref1 = (st = err.istack)) != null ? _ref1.length : void 0) {
                              _this.log("ISTACK (iced esc async stack):", {
                                red: true,
                                underline: true
                              });
                              _this.log(st.map(function(x) {
                                if (x) {
                                  return x;
                                } else {
                                  return "??? (missing 'where' information)";
                                }
                              }).map(function(x) {
                                return "  " + x;
                              }).join('\n'), {});
                            }
                          } else {
                            _this.log("Value passed as error is of type: " + tof, {
                              red: true
                            });
                          }
                        }
                        return _next(C.is_ok() && !err ? (_this._successes++, _this.report_good_outcome("" + CHECK + " " + fn + ": " + k)) : (_this.report_bad_outcome(outcome = "" + BAD_X + " TESTFAIL " + fn + ": " + k), _this._failures.push(outcome), hit_any_error = true));
                      });
                    });
                  }
                };
                _while(__iced_k);
              })(__iced_k);
            }
          })(function() {
            (function(__iced_k) {
              if (destroy != null) {
                (function(__iced_k) {
                  __iced_deferrals = new iced.Deferrals(__iced_k, {
                    parent: ___iced_passed_deferral,
                    filename: "/home/zapu/Projects/iced-test/index.iced",
                    funcname: "Runner.run_code"
                  });
                  _this.run_test_case_guarded(destroy, fo.new_case(), __iced_deferrals.defer({
                    assign_fn: (function() {
                      return function() {
                        return err = arguments[0];
                      };
                    })(),
                    lineno: 277
                  }));
                  __iced_deferrals._fulfill();
                })(__iced_k);
              } else {
                (function(__iced_k) {
                  __iced_deferrals = new iced.Deferrals(__iced_k, {
                    parent: ___iced_passed_deferral,
                    filename: "/home/zapu/Projects/iced-test/index.iced",
                    funcname: "Runner.run_code"
                  });
                  fo.default_destroy(__iced_deferrals.defer({
                    lineno: 279
                  }));
                  __iced_deferrals._fulfill();
                })(__iced_k);
              }
            })(function() {
              _this._file_states[fn] = !hit_any_error && !err;
              return cb(err);
            });
          });
        };
      })(this));
    };

    Runner.prototype.report = function() {
      var file_failures, k, opts, v;
      if (this._rc < 0) {
        this.err("" + BAD_X + " Failure due to test configuration issues");
      }
      if (this._tests !== this._successes) {
        this._rc = -1;
      }
      opts = this._rc === 0 ? {
        green: true
      } : {
        red: true
      };
      opts.bold = true;
      this.log("Tests: " + this._successes + "/" + this._tests + " passed", opts);
      if (this._n_files !== this._n_good_files) {
        this.err(" -> Only " + this._n_good_files + "/" + this._n_files + " files ran properly", {
          bold: true
        });
      }
      if ((file_failures = (function() {
        var _ref, _results;
        _ref = this._file_states;
        _results = [];
        for (k in _ref) {
          v = _ref[k];
          if (!v) {
            _results.push(k);
          }
        }
        return _results;
      }).call(this)).length) {
        this.log("Failed in files (pass as arguments to runner to retry):", {
          red: true
        });
        this.log("  " + file_failures.join(' '), {});
        this.log("", {});
      }
      return this._rc;
    };

    Runner.prototype.err = function(e, opts) {
      if (opts == null) {
        opts = {};
      }
      opts.red = true;
      this.log(e, opts);
      return this._rc = -1;
    };

    Runner.prototype.waypoint = function(txt) {
      return this.log("  " + WAYPOINT + " " + txt, {
        green: true
      });
    };

    Runner.prototype.report_good_outcome = function(txt) {
      return this.log(txt, {
        green: true
      });
    };

    Runner.prototype.report_bad_outcome = function(txt) {
      return this.log(txt, {
        red: true,
        bold: true
      });
    };

    Runner.prototype.test_error_message = function(txt) {
      return this.log("- " + txt, {
        red: true
      });
    };

    Runner.prototype.init = function(cb) {
      return cb(true);
    };

    Runner.prototype.finish = function(cb) {
      return cb(true);
    };

    return Runner;

  })();

  exports.ServerRunner = ServerRunner = (function(_super) {
    __extends(ServerRunner, _super);

    function ServerRunner() {
      ServerRunner.__super__.constructor.call(this);
    }

    ServerRunner.prototype.run_file = function(f, cb) {
      var dat, e, m, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          try {
            m = path.resolve(_this._dir, f);
            dat = require(m);
            _this._cur_file_path = m;
            if (dat.skip == null) {
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "/home/zapu/Projects/iced-test/index.iced",
                  funcname: "ServerRunner.run_file"
                });
                _this.run_code(f, dat, __iced_deferrals.defer({
                  lineno: 347
                }));
                __iced_deferrals._fulfill();
              })(__iced_k);
            } else {
              return __iced_k();
            }
          } catch (_error) {
            e = _error;
            _this.err("When importing test file '" + f + "' (not running tests yet):");
            _this.err("In reading " + m + ": " + e + "\n" + e.stack);
            _this._file_states[f] = false;
            _this._n_files++;
            return cb(e);
          }
        });
      })(this)((function(_this) {
        return function() {
          return cb();
        };
      })(this));
    };

    ServerRunner.prototype.log = function(msg, _arg) {
      var bold, green, red, underline;
      green = _arg.green, red = _arg.red, bold = _arg.bold, underline = _arg.underline;
      if (green) {
        msg = msg.green;
      }
      if (bold) {
        msg = msg.bold;
      }
      if (red) {
        msg = msg.red;
      }
      if (underline) {
        msg = msg.underline;
      }
      return console.log(msg);
    };

    ServerRunner.prototype.load_files = function(_arg, cb) {
      var base, err, file, files, files_dir, k, mainfile, ok, re, whitelist, wld, ___iced_passed_deferral, __iced_deferrals, __iced_k, _i, _len;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      mainfile = _arg.mainfile, whitelist = _arg.whitelist, files_dir = _arg.files_dir;
      wld = null;
      if (whitelist != null) {
        wld = {};
        for (_i = 0, _len = whitelist.length; _i < _len; _i++) {
          k = whitelist[_i];
          wld[k] = true;
        }
      }
      this._dir = path.dirname(mainfile);
      if (files_dir != null) {
        this._dir = path.join(this._dir, files_dir);
      }
      base = path.basename(mainfile);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/zapu/Projects/iced-test/index.iced",
            funcname: "ServerRunner.load_files"
          });
          fs.readdir(_this._dir, __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return files = arguments[1];
              };
            })(),
            lineno: 383
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          var _j, _len1;
          if (typeof err !== "undefined" && err !== null) {
            ok = false;
            _this.err("In reading " + _this._dir + ": " + err);
          } else {
            ok = true;
            re = /.*\.(iced|coffee)$/;
            for (_j = 0, _len1 = files.length; _j < _len1; _j++) {
              file = files[_j];
              if (file.match(re) && (file !== base) && ((wld == null) || wld[file])) {
                _this._files.push(file);
              }
            }
            _this._files.sort(sort_fn);
          }
          return cb(ok);
        };
      })(this));
    };

    ServerRunner.prototype.report_good_outcome = function(msg) {
      return console.log(msg.green);
    };

    ServerRunner.prototype.report_bad_outcome = function(msg) {
      return console.log(msg.bold.red);
    };

    ServerRunner.prototype.run = function(opts, cb) {
      var ok, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      this._filter_pattern = opts.filter_pattern;
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/zapu/Projects/iced-test/index.iced",
            funcname: "ServerRunner.run"
          });
          _this.init(__iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return ok = arguments[0];
              };
            })(),
            lineno: 405
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          (function(__iced_k) {
            if (ok) {
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "/home/zapu/Projects/iced-test/index.iced",
                  funcname: "ServerRunner.run"
                });
                _this.load_files(opts, __iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      return ok = arguments[0];
                    };
                  })(),
                  lineno: 406
                }));
                __iced_deferrals._fulfill();
              })(__iced_k);
            } else {
              return __iced_k();
            }
          })(function() {
            (function(__iced_k) {
              if (ok) {
                (function(__iced_k) {
                  __iced_deferrals = new iced.Deferrals(__iced_k, {
                    parent: ___iced_passed_deferral,
                    filename: "/home/zapu/Projects/iced-test/index.iced",
                    funcname: "ServerRunner.run"
                  });
                  _this.run_files(__iced_deferrals.defer({
                    lineno: 407
                  }));
                  __iced_deferrals._fulfill();
                })(__iced_k);
              } else {
                return __iced_k();
              }
            })(function() {
              _this.report();
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "/home/zapu/Projects/iced-test/index.iced",
                  funcname: "ServerRunner.run"
                });
                _this.finish(__iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      return ok = arguments[0];
                    };
                  })(),
                  lineno: 409
                }));
                __iced_deferrals._fulfill();
              })(function() {
                return cb(_this._rc);
              });
            });
          });
        };
      })(this));
    };

    return ServerRunner;

  })(Runner);

  $ = function(m) {
    var _ref;
    return typeof window !== "undefined" && window !== null ? (_ref = window.document) != null ? _ref.getElementById(m) : void 0 : void 0;
  };

  exports.BrowserRunner = BrowserRunner = (function(_super) {
    __extends(BrowserRunner, _super);

    function BrowserRunner(divs) {
      this.divs = divs;
      BrowserRunner.__super__.constructor.call(this);
    }

    BrowserRunner.prototype.log = function(m, _arg) {
      var bold, green, k, red, style, style_tag, tag, underline, v;
      red = _arg.red, green = _arg.green, bold = _arg.bold, underline = _arg.underline;
      style = {
        margin: "0px"
      };
      if (green) {
        style.color = "green";
      }
      if (red) {
        style.color = "red";
      }
      if (bold) {
        style["font-weight"] = "bold";
      }
      if (underline) {
        style["text-decoration"] = "underline";
      }
      style_tag = ((function() {
        var _results;
        _results = [];
        for (k in style) {
          v = style[k];
          _results.push("" + k + ": " + v);
        }
        return _results;
      })()).join("; ");
      tag = "<p style=\"" + style_tag + "\">" + m + "</p>\n";
      return $(this.divs.log).innerHTML += tag;
    };

    BrowserRunner.prototype.run = function(modules, cb) {
      var k, ok, v, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "/home/zapu/Projects/iced-test/index.iced",
            funcname: "BrowserRunner.run"
          });
          _this.init(__iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return ok = arguments[0];
              };
            })(),
            lineno: 439
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          (function(__iced_k) {
            var _i, _k, _keys, _ref, _results, _while;
            _ref = modules;
            _keys = (function() {
              var _results1;
              _results1 = [];
              for (_k in _ref) {
                _results1.push(_k);
              }
              return _results1;
            })();
            _i = 0;
            _while = function(__iced_k) {
              var _break, _continue, _next;
              _break = __iced_k;
              _continue = function() {
                return iced.trampoline(function() {
                  ++_i;
                  return _while(__iced_k);
                });
              };
              _next = _continue;
              if (!(_i < _keys.length)) {
                return _break();
              } else {
                k = _keys[_i];
                v = _ref[k];
                if (!v.skip) {
                  (function(__iced_k) {
                    __iced_deferrals = new iced.Deferrals(__iced_k, {
                      parent: ___iced_passed_deferral,
                      filename: "/home/zapu/Projects/iced-test/index.iced",
                      funcname: "BrowserRunner.run"
                    });
                    _this.run_code(k, v, __iced_deferrals.defer({
                      assign_fn: (function() {
                        return function() {
                          return ok = arguments[0];
                        };
                      })(),
                      lineno: 441
                    }));
                    __iced_deferrals._fulfill();
                  })(_next);
                } else {
                  return _continue();
                }
              }
            };
            _while(__iced_k);
          })(function() {
            _this.report();
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "/home/zapu/Projects/iced-test/index.iced",
                funcname: "BrowserRunner.run"
              });
              _this.finish(__iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return ok = arguments[0];
                  };
                })(),
                lineno: 443
              }));
              __iced_deferrals._fulfill();
            })(function() {
              $(_this.divs.rc).innerHTML = _this._rc;
              return cb(_this._rc);
            });
          });
        };
      })(this));
    };

    return BrowserRunner;

  })(Runner);

  exports.run = run = function(_arg) {
    var files_dir, filter_pattern, klass, mainfile, rc, runner, whitelist, ___iced_passed_deferral, __iced_deferrals, __iced_k;
    __iced_k = __iced_k_noop;
    ___iced_passed_deferral = iced.findDeferral(arguments);
    mainfile = _arg.mainfile, klass = _arg.klass, whitelist = _arg.whitelist, filter_pattern = _arg.filter_pattern, files_dir = _arg.files_dir, runner = _arg.runner;
    if (runner == null) {
      if (klass == null) {
        klass = ServerRunner;
      }
      runner = new klass();
    }
    (function(_this) {
      return (function(__iced_k) {
        __iced_deferrals = new iced.Deferrals(__iced_k, {
          parent: ___iced_passed_deferral,
          filename: "/home/zapu/Projects/iced-test/index.iced"
        });
        runner.run({
          mainfile: mainfile,
          whitelist: whitelist,
          files_dir: files_dir,
          filter_pattern: filter_pattern
        }, __iced_deferrals.defer({
          assign_fn: (function() {
            return function() {
              return rc = arguments[0];
            };
          })(),
          lineno: 453
        }));
        __iced_deferrals._fulfill();
      });
    })(this)((function(_this) {
      return function() {
        return process.exit(rc);
      };
    })(this));
  };

  exports.main = main = function(_arg) {
    var argv, files_dir, mainfile, whitelist;
    mainfile = _arg.mainfile, files_dir = _arg.files_dir;
    argv = require('minimist')(process.argv.slice(2));
    whitelist = argv._.length > 0 ? argv._ : null;
    if (files_dir == null) {
      files_dir = "files";
    }
    return run({
      mainfile: mainfile,
      whitelist: whitelist,
      files_dir: files_dir
    });
  };

}).call(this);

//# sourceMappingURL=index.js.map
