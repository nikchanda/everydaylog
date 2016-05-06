
var app = {
    config: {
      host: "http://ws.everydaylog.com"
    },
    data: {
      settime: "",
      reportdate: ""
    },
    logger: function(msg,level) {
            console.log(msg);
    },
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};



$(function(){

      var dailylogUser = "abc123";


      var loadReport = function(date) {

          var tmpl = '<a class="list-group-item"><div class="row"><div class="col-xs-12"><i class="fa fa-2x {{icon}} pull-left"></i><h4 class="list-group-item-heading">{{time}}</h4><p class="list-group-item-text">{{title}}</p><p class="list-group-item-text expand-text">{{desc}}</p></div></div></a>';

          if (app.data.reportdate == "") {
            app.data.reportdate = new Date();
          }

          var d = app.data.reportdate;
          var datestr = d.getFullYear() +"-"+ (d.getMonth()+1) +"-"+ d.getDate();

          $.ajax({
                contentType: 'application/json',
                dataType: 'json',
                success: function(data){
                    var list = $("div[data-section-id='report']").find(".list-group");

                    // clear previous results
                    list.html("");

                    for(idx in data.entries) {
                      var entry = data.entries[idx];
                      var displaytime = $.format.date(entry.time, "h:mm p");

                      var item = tmpl.replace("{{icon}}", getIconClass(entry.type));
                      item = item.replace("{{time}}", displaytime);
                      item = item.replace("{{title}}", entry.title);
                      item = item.replace("{{desc}}", entry.description);
                      list.append(item);

                    }
                },
                error: function(){
                    console.log("Device control failed");
                },
                processData: false,
                type: 'GET',
                url: app.config.host +'/report/'+ dailylogUser +'/'+ datestr
              });
      };

      var getIconClass = function(type) {
          var icons = {
            "food": "fa-cutlery",
            "fluids": "fa-tint",
            "activity": "fa-smile-o",
            "report": "fa-bar-chart",
          }

          return icons[type];
      }

      

      var setTime = function(dt) {
          app.data.settime = typeof dt != "undefined" ? dt : new Date();
          displaySetTime();
      };

      var displaySetTime = function() {
        var d = $.format.date(app.data.settime,"ddd, MMM d - h:mm p");
        $("#time-selected").val(d);
      }

      var setReportDate = function(dt) {
          app.data.reportdate = typeof dt != "undefined" ? dt : new Date();
          displayReportDate();
      }

      var displayReportDate = function() {
        var d = $.format.date(app.data.reportdate,"ddd, MMM d");
        $("#report-date").val(d);
      }

      
      $(window).hashchange( function(){
          
          var hash = location.hash;
          $("a[href^='#']").each(function(){
              var that = $(this);
              var parent = that.closest("li");
              that[ that.attr( 'href' ) === hash ? 'addClass' : 'removeClass' ]( 'active' );
              parent[ that.attr( 'href' ) === hash ? 'addClass' : 'removeClass' ]( 'active' );
          });

          $("div[data-section-id]").each(function(){
              var that = $(this);
              that[ that.attr( 'data-section-id' ) !== hash.replace("#","") ? 'addClass' : 'removeClass' ]( 'hidden' );
          });


          // report view
          if (hash.indexOf("report") > -1) {
            $("#logit-control").hide();
            loadReport();
          }
          else {
            $("#logit-control").show();
          }

      });
      $(window).hashchange();

      $("button[data-toggle='offcanvas']").click( function(e) {
          console.log("here");
      }); 




      bootcards.init( {
        offCanvasBackdrop : true,
        offCanvasHideOnMainClick : true,
        enableTabletPortraitMode : true,
        disableRubberBanding : true,
        disableBreakoutSelector : 'a.no-break-out'
      });

      //enable FastClick
      window.addEventListener('load', function() {
          FastClick.attach(document.body);
      }, false);

      //activate the sub-menu options in the offcanvas menu
      $('.collapse').collapse();

    
      $(".btn-logit").click(function(){

          var ts = $.format.date(app.data.settime, "yyyy-MM-dd H:mm:ss");

          var entry = {user: dailylogUser, type: location.hash.replace("#",""), time: ts};

          var $panel = $(".app-panel").not(".hidden");
          var $inputs = $panel.find("form :input"); 

          if ($inputs.length > 0) {
            $inputs.each(function(){
              entry[$(this).attr("name")] = $(this).val();
            });
          }

          if (entry.type != "") {
              $.ajax({
                contentType: 'application/json',
                data: JSON.stringify(entry),
                dataType: 'json',
                success: function(data){
                    console.log(data);
                },
                error: function(){
                    console.log("Device control failed");
                },
                processData: false,
                type: 'POST',
                url: app.config.host +'/event/log'
              });
          } 

      });

      $(".btn-time").click(function(){
          setTime();
      });



      $(document).ready(function(){
          amplitude.setUserId(dailylogUser);
          amplitude.logEvent("app.loaded");
      });
      


      /// select list titles
      $("div[data-section-id='fluids']").find("select").on("change", function(e){

          var $panel = $("div[data-section-id='fluids']");
          var title = "";

          if ($panel.find("select[name='volume']").val() != null) {
            title += $panel.find("select[name='volume'] option:selected").val() +" oz of ";
          }

          if ($panel.find("select[name='fluid']").val() != null) {
            title += $panel.find("select[name='fluid'] option:selected").text() +" ";
          }

          $panel.find("input[name='title']").val(title);
      })

      $("div[data-section-id='activity']").find("select").on("change", function(e){
          
          var $panel = $("div[data-section-id='activity']");
          var title = "";

          if ($panel.find("select[name='activity']").val() != null) {
            title += $panel.find("select[name='activity'] option:selected").text() +" ";
          }
          
          if ($panel.find("select[name='duration']").val() != null) {
            title += "for "+ $panel.find("select[name='duration'] option:selected").text() +" ";
          }

          if ($panel.find("select[name='intensity']").val() != null) {  
            var label = $panel.find("select[name='intensity'] option:selected").attr("data-label");    
            title += "at "+ $panel.find("select[name='intensity'] option:selected").text() +" "+ label +" ";
          }

          if ($panel.find("select[name='mood']").val() != null) {
            title += "feeling "+ $panel.find("select[name='mood'] option:selected").text();
          }

          $panel.find("input[name='title']").val(title);
      });


      $(".btn-date-next").click(function(e){
            var rd = app.data.reportdate;
            rd.setDate(rd.getDate() +1);
            setReportDate(rd);
            loadReport(rd);
      });

      $(".btn-date-prev").click(function(e){
            var rd = app.data.reportdate;
            rd.setDate(rd.getDate() -1);
            setReportDate(rd);
            loadReport(rd);
      });


      setTime();
      setReportDate();  

      $("#time-selected").datetimepicker({
        lang: 'en',
        ampm: true,
        startDate: app.data.settime,
        todayButton: true,
        maxDate: 0,
        step: 15,
        onSelectTime: function(ct, $i){
            setTime(ct);
            console.log(app.data.settime);
        }
      });  


      //$("#time-selected").attr("readonly",true)

});