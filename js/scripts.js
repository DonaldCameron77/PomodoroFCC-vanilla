/*  Free Code Camp - Pomodoro Clock Challenge
    First Incarnation - jQuery, Bootstrap, homebuilt MVC
    Creator: Donald Cameron
    Date created: 2017-02-25

    The prior attempt did not go too well b/c without MVC, keeping track of
    what should be in a model was messy as to (a) where it lived, and
    (b) were we updating it consistently?  Soooo ... we now have this one.

    // TODO: consider converting layout to Flexbox before moving on to a REACT version.

    N.B.: ID names are chosen to pass the FCC tests!
*/

/*  The state mechanism (based on the FCC exemplar):

    The states are 'running' and 'stopped' (strings).
    The controls are increment/decrement (timer values),
    reset timer, and play/pause.

    If the state is 'stopped', then
    - increment/decrement work.  Note that the value incremented/decremented
      is the value in the length control, NOT the current clock timer value.
      AND
      -- if the clock mode is "session" and session is being incremented/decremented,
         then the adjusted length becomes the new value displayed in the (paused)
         clock, and similarly if clock mode is "break."
      -- if the clock mode is "session" and the break length is adjusted, the
         new value becomes the pending value to be used when the session timer
         runs out and we're switching to break.
    - reset sets state to stopped and changes the clock time and
      the numbers in the increment/decrement displays to the initial values
      (the defaults).
    - play/pause displays play and clicking causes countdown to
      begin or restart.  The button symbol (fa icon) is changed from play
      to pause.

    If the state is 'running', then
    - increment/decrement are disabled
    - reset still works (should there be a guarding modal?).  There is not one,
      and it would probably cause tests to fail.
    - play/pause changes state to 'stopped' and countdown halts.
      fa icon is changed to play.
*/

$(document).ready(function() { // ~~~~~~~~~~~~~~~

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ VIEW ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  // TODO: Ensure these ID names only occur once and only in the view, so if
  // they get misspelled we know where to look and one fix fixes everything.

  // The IDs that can receive or send data are
  //
  //   (Duration controls)
  //    break-decrement
  //    break-length
  //    break-increment
  //
  //    session-decrement
  //    session-length
  //    session-increment
  //
  //   (Clock)
  //    timer-label
  //    time-left
  //
  //   (Playback controls)
  //    start_stop
  //    reset
  //
  //  We also had to add the class .play-btn to allow toggling
  //  the play/pause icon on its button
  //

  // VIEW OBJECT ============================================

  var View = {

    // View utilities ~~~~~~~~~~~~~~~~~~~~

    // make string of form minutes:seconds, ensuring 2 digits for each
    // TODO: should this be nested function of updateClockTime?
    formatClockTime: function (minutes, seconds) {
      // return 2-digit string form of number
      function formatTimeSegment(n) {
        return (n < 10 ? '0' : '') + n;
      }
      return formatTimeSegment(minutes) + ':' + formatTimeSegment(seconds);
    },

    playBeep: function () {
      // NOT using jQuery b/c $(<id>) is a jQ object, but
      // we need the underlying DOM element so would have to
      // say $('#beep')[0].play() or $('#beep').get(0).play().  Instead just do
      document.getElementById('beep').play();
    },

    // main View procedures ~~~~~~~~~~~~~~~~~~~~

    // Clock ~~~~~~~~~~~~~~~~~~~~

    // format and stuff the new time into the main clock display
    updateClockTime: function (minutes, seconds) {
      var timeString = this.formatClockTime(minutes, seconds);
      $('#time-left').text(timeString);
    },

    // will stuff "session" or "break" into clock display
    updateClockModeLabel: function (modeStr) {
      $('#timer-label').text(modeStr)
    },

    // Playback controls ~~~~~~~~~~~~~~~~~~~~

    // changing this to require a parameter always.  No toggling (too hard
    // to keep in sync with play/pause state)
    setPlayButtonIcon: function (wantPlay) {
      // Set play/pause icon on Play button.  There are two cases:
      // - user clicked play/pause.  Toggle the icon.
      // - user clicked Reset (and app could be either in
      //   play or pause mode.  Ensure Play icon is displayed.
      var playButton = $('.play-btn');

      if (wantPlay && playButton.hasClass('fa-pause')) {
        playButton.removeClass('fa-pause');
        playButton.addClass('fa-play');
      }
      else if (!wantPlay && playButton.hasClass('fa-play')) {
        playButton.removeClass('fa-play');
        playButton.addClass('fa-pause');
      }
    },

    updateSessionLength: function(newSessionLength) {
      $('#session-length').text(newSessionLength);
    },

    updateBreakLength: function(newBreakLength) {
      $('#break-length').text(newBreakLength);
    },

    resetUpdateView: function (breakVal, sessionVal, timerModeLabel, minutes, seconds) {
      // resetting the play/pause button text to fa-play is hardcoded
      this.updateBreakLength(breakVal);
      this.updateSessionLength(sessionVal);
      this.updateClockModeLabel(timerModeLabel); // will be 'session' after reset
      this.updateClockTime(minutes, seconds);
    }

  }; // View object

  // Event handlers "belong" to View but are not in object scope ~~~~~~~~~~~~~~~~~~

  // Playback controls ~~~~~~~~~~~~~~~~~~~~~~~~~

  $('#start_stop').click(function() {
    Controller.handleStartStop();
  });

  // Note reset is always active, so if it's clicked
  // when state = started, the play/pause button must
  // have its icon reset to 'play'.
  $('#reset').click(function() {
    Controller.handleReset();
  });

  // Timer start values increment/decrement ~~~~~~~~~~~~~~~~~~~~

  /* TODO: how are these things going to work?  Are we gonna
     factor common code which then needs to be parameterized?  Or
     are we just gonna repeat everything four times with minimal variation?

     Here's what has to happen for each one of these:
     - the clicks will register here, but nothing is supposed
       to happen unless the app is paused.
     - if the app is paused in session mode, then +/- of break
       just modifies break.  But +/- of session changes the
       clock display (and the countdown min/sec in the Model).
       And vice/versa if app is in break mode.
     - all the data is in the model, and View isn't allowed to
       touch it, so View has to notify the controller that an
       increment or decrement happened.  The controller decides
       if the new value is still in range (0 <= value <= 60) and
       if so it calls back the View to update the visible value field
       (hint: if you make this a callback then you don't have so
       much coupling??).
    - the controller is of course going to update the model with
      the new pending value(s).

    Sooo ... the TODO question is will Controller have four corresponding
    routines, or two, or just one?
  */

  $('#break-decrement').click(function() {
    Controller.adjustTimerLength('break', '-');
  });

  $('#break-increment').click(function() {
    Controller.adjustTimerLength('break', '+');
  });

  $('#session-decrement').click(function() {
    Controller.adjustTimerLength('session', '-');
  });

  $('#session-increment').click(function() {
      Controller.adjustTimerLength('session', '+');
  });

  // ========================== TEMP for experiments ================== */

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ MODEL ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  var Model = {
    init: function (minutes, seconds, breakLength, sessionLength,
                    timerLabel, state, mode) {
      this.minutes = minutes;
      this.seconds = seconds;
      this.breakLength = breakLength;
      this.sessionLength = sessionLength
      this.timerLabel = timerLabel;
      this.state = state;
      this.mode = mode;
    },
    timer: undefined // setInterval, clearInterval
  };

  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ CONTROLLER ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
  /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

  var /*const*/ SESSION_LABEL = "Session",
                BREAK_LABEL = "Break";

  var /*const*/ DEFAULTS = {
    minutes: 25,
    seconds: 0,
    breakLength: 5, // user can change these ... they get back to defaults upon reset
    sessionLength: 25,
    timerLabel: SESSION_LABEL,
    state: 'stopped',
    mode: 'session'  // b/c if you pressed play after loading or refresh, you'd be in 'session' mode.
                      // You only get into 'break' mode by switching into it when session timer runs out.
  };

  // TODO: make default minutes depend on default session length
  // TODO: should pass an object, avoiding issues with order of parameters
  var Controller = {
    init: function() { // called initially, and also upon reset
      Model.init(
        DEFAULTS.minutes,
        DEFAULTS.seconds,
        DEFAULTS.breakLength,
        DEFAULTS.sessionLength,
        DEFAULTS.timerLabel,
        DEFAULTS.state,
        DEFAULTS.mode
      );
      View.setPlayButtonIcon(true);
    },

    handleStartStop: function () {
      if (Model.state === 'running') {
        clearInterval(Model.timer);
        View.setPlayButtonIcon(false);
        Model.state = 'stopped';
        Model.timer = undefined; // needed?
      }
      else {
        View.setPlayButtonIcon(true);
        Model.state = 'running';
        Model.timer = setInterval(this.countdown, 1000);
      }
    },

    countdown: function() {
      if ( ! (Model.minutes === 0 && Model.seconds === 0) ) {
        // just tick the clock
        Model.seconds --;
        if (Model.seconds < 0) {
          Model.seconds = 59;
          Model.minutes --;
        }
        View.updateClockTime(Model.minutes, Model.seconds);
        return;
      }

      // timer has run out - must switch timer modes and restart
      clearInterval(Model.timer);
      View.playBeep();
      // debugger;
      if (Model.mode = 'session') { // switching into Break mode
        Model.minutes = Model.breakLength; // note seconds already 0
        Model.mode = 'break';
        View.updateClockModeLabel(BREAK_LABEL);
      }
      else {
        Model.minutes = Model.sessionLength;
        Model.mode = 'session';
        View.updateClockModeLabel(SESSION_LABEL);
      }
      View.updateClockTime(Model.minutes, Model.seconds);
      Model.timer = setInterval(Controller.countdown, 1000);
    },

    handleReset() {
      // debugger;
      if (Model.state = 'running') {
        clearInterval(Model.timer);
      }
      this.init(); // should set play/pause button to play
      // TODO: are these funcs still needed?
      // View.updateClockModeLabel(SESSION_LABEL);
      // View.updateClockTime(Model.minutes, Model.seconds);
      // debugger;
      View.resetUpdateView(
            Model.breakLength, Model.sessionLength, Model.timerLabel, Model.minutes, Model.seconds);
    },

    adjustTimerLength: function (modeToAdjust, direction) {
      if (Model.state === 'running') {
        return;
      }
      var curVal = (modeToAdjust === 'session') ? Model.sessionLength : Model.breakLength;

      if (direction === '-' && curVal <= 1 ||
          direction === '+' && curVal >= 60) {
        return;
      }

      curVal = curVal + (direction === '-' ? -1 : +1);

      if (modeToAdjust === 'session') {
        Model.sessionLength = curVal;
        View.updateSessionLength(curVal);
      }
      else {
        Model.breakLength = curVal;
        View.updateBreakLength(curVal);
      }

      // Are we updating the length for current timer mode?  If so, the adjusted value
      // becomes the new timer value;
      if (Model.mode === modeToAdjust) {
        Model.minutes = curVal;
        Model.seconds = 0;
        View.updateClockTime(curVal, 0);
      }
    } // adjustTimerLength

  }; // Controller

  Controller.init();

});
