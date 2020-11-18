"use strict";

const Gst = imports.gi.Gst;

Gst.init(null);

var Audio = class Audio {
  constructor() {
    this.playbin = Gst.ElementFactory.make("playbin", null);

    this.bus = this.playbin.get_bus();
    this.bus.add_signal_watch();
    this.bus.connect("message", this.handleMessage.bind(this));
  }

  play(uri) {
    this.playbin.set_property("uri", uri);
    this.playbin.set_state(Gst.State.PLAYING);
  }

  handleMessage(_, message) {
    if (message && message.type === Gst.MessageType.EOS) {
      this.playbin.set_state(Gst.State.NULL);
    }
  }
};
