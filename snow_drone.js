// Set up a collection to contain vehicle information. On the server,
// it is backed by a MongoDB collection named "Vehicles".
Vehicles = new Mongo.Collection("snowDroneTest4");
GaugeData = new Mongo.Collection('gauge-data');

var MAP_ZOOM = 15;

if (Meteor.isClient) {
  Meteor.startup(function() {
    GoogleMaps.load();
  });
  var mapCurrentValue;
  var marker = new Array();
  var line = new Array();
  var markerCurrent;
  var image = 'https://s3-us-west-2.amazonaws.com/snowdrone/tack-car-top-view-hi.png';
  Template.leaderboard.helpers({
    vehicles: function () {
      return Vehicles.find({}, { sort: { speed: -1, name: 1 } });
    },
    selectedVehicle: function () {
      var vehicle = Vehicles.findOne(Session.get("selectedVehicle"));
      return vehicle && vehicle.name;
    },
    GPS_coordinates: function() {
      var vehicle = Vehicles.findOne(Session.get("selectedVehicle"));
      return vehicle.GPS_coordinates;
    },
    speed: function() {
      var vehicle = Vehicles.findOne(Session.get("selectedVehicle"));
      return vehicle.speed;
    },
    current_location: function() {
      var vehicle = Vehicles.findOne(Session.get("selectedVehicle"));
      return vehicle.current_location;
    },
    update: function() {
      var vehicle = Vehicles.findOne(Session.get("selectedVehicle"));
      var lastCoordinates;
      console.log("update triggered");
      if (typeof mapCurrentValue === 'undefined'){
        console.log("undefined");
        GoogleMaps.ready('map', function(map) {
        
          markerCurrent = new google.maps.Marker({
              position: new google.maps.LatLng(vehicle.current_location[0], vehicle.current_location[1]),
              map: map.instance,
              icon: image,
              title: "Current Location"
          });
        if (vehicle.GPS_coordinates.length > 0){
          for (i=0; i < vehicle.GPS_coordinates.length; i++){
              marker.push(new google.maps.Marker({
                position: new google.maps.LatLng(vehicle.GPS_coordinates[i][0], vehicle.GPS_coordinates[i][1]),
                draggable: true,
                map: map.instance
              }));
              if (i == 0){
                lastCoordinates = vehicle.current_location;
              }
              else {
                lastCoordinates = vehicle.GPS_coordinates[i-1];
              }
              line.push(new google.maps.Polyline({
                  path: [
                      new google.maps.LatLng(vehicle.GPS_coordinates[i][0], vehicle.GPS_coordinates[i][1]), 
                      new google.maps.LatLng(lastCoordinates[0], lastCoordinates[1])
                  ],
                  strokeColor: "#FF0000",
                  strokeOpacity: 1.0,
                  strokeWeight: 10,
                  map: map.instance
              }));
            }
          }
          
          // Center and zoom the map view onto the current position.
          map.instance.setCenter(markerCurrent.getPosition());
          map.instance.setZoom(MAP_ZOOM);
          mapCurrentValue = map;
      });
      return vehicle;
      }
      else{
        //GoogleMaps.ready('map', function(map) {,
        function setMapOnAll(map) {
          for (var i = 0; i < marker.length; i++) {
            marker[i].setMap(map);
          }
        }
        setMapOnAll(null);
        marker = [];
        function setMapOnAllLines(map) {
          for (var i = 0; i < line.length; i++) {
            line[i].setMap(map);
          }
        }
        setMapOnAllLines(null);
        line = [];
        markerCurrent.setMap(null);
        console.log(mapCurrentValue);
        map = mapCurrentValue;
          markerCurrent = new google.maps.Marker({
              position: new google.maps.LatLng(vehicle.current_location[0], vehicle.current_location[1]),
              map: map.instance,
              icon: image,
              title: "Current Location"
          });
        if (vehicle.GPS_coordinates.length > 0){
          for (i = 0; i < vehicle.GPS_coordinates.length; i++){
              marker.push(new google.maps.Marker({
                position: new google.maps.LatLng(vehicle.GPS_coordinates[i][0], vehicle.GPS_coordinates[i][1]),
                map: map.instance,
                dragable: true
              }));
              if (i == 0){
                lastCoordinates = vehicle.current_location;
              }
              else{
                lastCoordinates = vehicle.GPS_coordinates[i-1];
              }
              console.log("dest, loc");
              console.log(vehicle.GPS_coordinates[i]);
              console.log(lastCoordinates);
              line.push(new google.maps.Polyline({
                  path: [
                      new google.maps.LatLng(vehicle.GPS_coordinates[i][0], vehicle.GPS_coordinates[i][1]), 
                      new google.maps.LatLng(lastCoordinates[0], lastCoordinates[1])
                  ],
                  strokeColor: "#FF0000",
                  strokeOpacity: 1.0,
                  strokeWeight: 10,
                  map: map.instance
              }));
            }

            
            // Center and zoom the map view onto the current position.
            map.instance.setCenter(markerCurrent.getPosition());
            map.instance.setZoom(MAP_ZOOM);
            mapCurrentValue = map;
        //});
        return vehicle;
        }
      }
    }
  });

  Template.leaderboard.events({
    'click .Clear_Coordinates': function () {
      var selectedVehicle = Session.get("selectedVehicle");
      var vehicle = Vehicles.findOne(selectedVehicle);
      var textArray = JSON.parse("[]");
      Vehicles.update(selectedVehicle, {$set: {GPS_coordinates: textArray}});
    }
  });

  Template.leaderboard.events({
    'click .Change_State': function () {
      var selectedVehicle = Session.get("selectedVehicle");
      var vehicle = Vehicles.findOne(selectedVehicle);
      if (vehicle.status == "OFF"){
        Vehicles.update(selectedVehicle, {$set: {status: "ON", speed: 5}});
      }
      else {
        Vehicles.update(selectedVehicle, {$set: {status: "OFF", speed: 0}});
      }
    }
  });
  
  Template.leaderboard.events({
    'submit .input_GPS': function (event) {
      event.preventDefault();
      var selectedVehicle = Session.get("selectedVehicle");
      if (event.target.text.value != ""){
         var textArray = JSON.parse("["+event.target.text.value+"]");
        // var originalArray = Vehicles.findOne(selectedVehicle);
        // originalArray.push(textArray);
        Vehicles.update(selectedVehicle, {$push: {GPS_coordinates: textArray}});
        event.target.text.value = "";
      }
    }
  });

  Template.vehicle.helpers({
    selected: function () {
      return Session.equals("selectedVehicle", this._id) ? "selected" : '';
    }
  });

  Template.vehicle.events({
    'click': function () {
      Session.set("selectedVehicle", this._id);
    }
  });
  //maps
  Template.map.helpers({  
    geolocationError: function() {
      var error = Geolocation.error();
      return error && error.message;
    },
    mapOptions: function() {
      var latLng = Geolocation.latLng();
      // Initialize the map once we have the latLng.
      if (GoogleMaps.loaded() && latLng) {
        return {
          center: new google.maps.LatLng(latLng.lat, latLng.lng),
          zoom: MAP_ZOOM
        };
      }
    }
  });

  Template.map.onCreated(function() {  
    var self = this;
    var vehicle = Vehicles.findOne(Session.get("selectedVehicle"));

    // GoogleMaps.ready('map', function(map) {
    //   mapCurrentValue = map;
    //   var markerCurrent;
    //   var marker = new Array();
    //   var line = new Array();
    //   var lastCoordinates;
    //   // Create and move the marker when latLng changes.
    //   // self.autorun(function() {
    //     // var latLng = Geolocation.latLng();
    //     // if (! latLng)
    //     //   return;

    //     // // If the marker doesn't yet exist, create it.
    //     // if (! marker) {
    //     //   marker = new google.maps.Marker({
    //     //     position: new google.maps.LatLng(latLng.lat, latLng.lng),
    //     //     map: map.instance
    //     //   });
    //     // }
    //     // // The marker already exists, so we'll just change its position.
    //     // else {
    //     //   marker.setPosition(latLng);
    //     // }
    //     markerCurrent = new google.maps.Marker({
    //         position: new google.maps.LatLng(vehicle.current_location[0], vehicle.current_location[1]),
    //         map: map.instance
    //     });
        
    //     // Center and zoom the map view onto the current position.
    //     map.instance.setCenter(markerCurrent.getPosition());
    //     map.instance.setZoom(MAP_ZOOM);
    //   // });
    // });
  });
  //

  Template.gauge1.onRendered(function() {
    var newGauge = new TunguskaGauge({
      id: "data1",
      theme: "basic"
    });
    Meteor.setInterval(function() {
      newGauge.set(Math.floor(Math.random()*101));
    }, 1123);
  });
}

// On server startup, create some Vehicles if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Vehicles.find().count() === 0) {
      var names = ["Vehicle 1", "Vehicle 2","Vehicle 3","Vehicle 4","Vehicle 5"];
      _.each(names, function (name) {
        Vehicles.insert({
          name: name,
          status: "OFF",
          speed: 0,
          current_location: [40.7951033,-77.86398600000001],
          GPS_coordinates: [],
          Abort: 0
        });
      });
    }
  });
}