
let icon = (name) => ["html", `<i class='material-icons'>${name}</i>`];
let icons = (...names) => ["html", names.map(icon).map(x=>x[1]).join("")];
let text = (name) => ["text", name];
$.fn.swapClass = function(a, b){
  return $(this).removeClass(a).addClass(b);
}
$.fn.jazzberry = function() {
  let self = this;
  let state =["_"];
  let transitions = {
    _: {
      INIT: () => ["idle", 0, 0, 0, 0],
    },
    idle: {
      NUM:   (digit, a, b, c, d) => ["idle", digit, a, b, c],
      START: (a, b, c, d) => ["active", (a + 10 * b + 60 * (c + 10*d))],
      RESET: () => ["idle", 0, 0, 0, 0],
    },
    active: {
      RESET: (t)  => ["paused", t],
      DECR: (t)   => t===0? ["notifying", t]:["active", t-1],
    },
    paused: {
      START: (t)  => ["active", t],      
      RESET: (t)  => ["idle", 0,0,0,0],
    },
    notifying: {
      DECR: () => ["idle", 0, 0, 0, 0],
    },
  };

  let decorations = {
    idle: {
      SHOW: (a,b,c,d) => text(`${d}${c}:${b}${a}`),
      NUM: (digit)    => text(digit),
      START: ()       => icon("play_arrow"),
      RESET: ()       => icon("clear"),
    },
    active: {
      SHOW: (t)       => text(seconds2str(t)),
      RESET: ()       => icon("pause"),
      DECR: (t)       => t===0? icon("alarm"): text("-1"),
    },
    paused: {
      START : ()      => icon("play_arrow"),
      RESET : ()      => icon("stop"), 
    },
    notifying: {
      DECR: ()        => icon("alarm_off"),

    },
  };
  
  var seconds2str = (t) => {
    t = Math.abs(t);
    let m = Math.floor(t/60);
    let s = t - m * 60;
    return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  };
  
  let bindings = []; // [[elem, event]]
  
  function get_transition(table,event,state){
    let [state_label, ...state_args] = state;
    let [event_label, ...event_args] = event;
     return table[state_label][event_label];
  }
  function update_ui(){
    let [state_label, ...state_args] = state;
    for(let [[ui,ev], [event_label, ...event_args]] of bindings){
      let decoration = decorations[state_label][event_label];
      if(decoration){
         // decorate
         ui.removeClass("disabled");

        let [jq_method,...jq_args] = decoration.apply(null,[...event_args,...state_args]);
        ui[jq_method].apply(ui,jq_args);
      } else {
        // disable
        ui.addClass("disabled");
      }
   } 
  }

  function SEND(...event){
    let [state_label, ...state_args] = state;
    let [event_label, ...event_args] = event;
    // find transition
    let transition = transitions[state_label][event_label];
    //console.log("TR", state_label, event_label,transition);
    // transit
    if(transition){
      let new_state = transition.apply(null, [...event_args,...state_args]);
      self.removeClass(state[0]).addClass(new_state[0]);
      state = new_state; 
      console.log("new state", state);
    } else {
      console.log(`the event "${event_label}" has no meaning in the state "${state_label}"`);
    }
    // update UI
    update_ui();

  };

  function bnd(ui_elem, ui_event, machine_event, ...args){
    bindings.push([[ui_elem, ui_event], [machine_event, ...args]]);
    ui_elem.on(ui_event, function(e){
      e.preventDefault();
      SEND(machine_event, ...args);
    });

  }


  // CREATE UI

  var timer = $('<div />', {
    addClass: 'jazzberry'
  }).appendTo(this);
  
  var display = $('<div />', {
    addClass: 'jazzberry__display',
    text: '00:00'
  }).appendTo(timer);
  bnd(display,"update","SHOW");

  var numpad = $('<div />', { addClass: 'jazzberry__numpad' }).appendTo(timer);
  var controlpad = $('<div />', { addClass: 'jazzberry__controlpad' }).appendTo(timer);

  for(let i=9;i>=0;i--){
    console.log(i);
    let num_btn = $('<div />', {
      addClass: 'key', 
      text: i.toString(),
      css: {"grid-area": `k${i}`},
    }).appendTo(numpad);
    bnd(num_btn,"click","NUM", i);
  }
  

  let start_btn = $('<div />', {
    addClass: 'key', 
    text: "START", 
    css: {"grid-area": "start"} 
  }).appendTo(controlpad);
  bnd(start_btn, "click", "START");

  let reset_btn = $('<div />', { 
    addClass: 'key',
    text: "RESET",
    css: {"grid-area": "reset"}
  }).appendTo(controlpad);
  bnd(reset_btn, "click", "RESET");

  let decr_btn = $('<div />', { 
    addClass: 'key',
    text: "",
    css: {"grid-area": "decr"}
  }).appendTo(controlpad);
  bnd(decr_btn, "click", "DECR");



  
  // INIT

  SEND("INIT");

};

$(document).ready(function() {
  $('.insert-jazzberry').jazzberry();
  //$(".linksy").linksy();
});
