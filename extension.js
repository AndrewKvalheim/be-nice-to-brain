"use strict";

const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;

const extension = ExtensionUtils.getCurrentExtension();
const { Audio } = extension.imports.lib.audio;

class Extension {
  constructor() {
    this.audio = new Audio();
    this.effect = new Clutter.DesaturateEffect();
    this.idleMonitor = Meta.IdleMonitor.get_core();

    const soundsDir = extension.dir.get_child("sounds");

    this.maxWork = 20 * 60; /* s */
    this.minBreak = 5 * 60; /* s */
    this.sounds = {
      breakComplete: soundsDir.get_child("break-complete.ogg").get_uri(),
      breakDue: soundsDir.get_child("break-due.ogg").get_uri(),
    };

    this.state = {
      idleWatch: undefined,
      workTimeout: undefined,
    };
  }

  enable() {
    this.state.idleWatch = this.idleMonitor.add_idle_watch(
      this.minBreak * 1000,
      this.handleIdle.bind(this)
    );

    this.handleActive();
  }

  disable() {
    if (this.state.workTimeout) {
      GLib.source_remove(this.state.workTimeout);
      this.state.workTimeout = undefined;
    }
    if (this.state.idleWatch) {
      this.idleMonitor.remove_watch(this.state.idleWatch);
    }

    Main.uiGroup.remove_effect(this.effect);
  }

  handleActive() {
    log("Started working");

    this.state.workTimeout = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      this.maxWork,
      this.handleWorkTimeout.bind(this)
    );
  }

  handleIdle() {
    if (this.state.workTimeout) {
      GLib.source_remove(this.state.workTimeout);
      this.state.workTimeout = undefined;

      log("Stopped working");
    } else {
      log("Completed break");
      Main.uiGroup.remove_effect(this.effect);
      this.audio.play(this.sounds.breakComplete);
    }

    this.idleMonitor.add_user_active_watch(this.handleActive.bind(this));
  }

  handleWorkTimeout() {
    this.state.workTimeout = undefined;

    log("Break due");
    Main.uiGroup.add_effect(this.effect);
    this.audio.play(this.sounds.breakDue);
  }
}

function init() {
  return new Extension();
}
