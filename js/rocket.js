var control;

var rocket = {};
(function (self) {

    var HEAT_LIMIT = 25;
    var FUEL_TANK_CAPACITY = 150;
    var GRAVITY =1// 9.807;

    var rocket = document.querySelector('.rocket');
    var legend = document.querySelector('.legend');

    var statElms = {
        fuel: legend.querySelector('.stat-fuel'),
        fuelTanks: legend.querySelector('.stat-fuel-tanks'),
        heat: legend.querySelector('.stat-heat'),
        speed: legend.querySelector('.stat-speed'),
        thrust: legend.querySelector('.stat-thrust'),
        height: legend.querySelector('.stat-height'),
        maxHeight: legend.querySelector('.stat-height-max')
    };

    var stats = {
        fuelTanks: 4,
        thrust: 0,
        speed: 0,
        heat: 0,
        fuel: 600,
        time: 0,
        height: 0,
        maxHeight: 0
    };

    var didSomething = false;
    var destroyed = false;
    var outOfFuel = false;
    var usedSlingshot = false;
    var takeoff = false;

    self.getSpeed = function () { return stats.speed; };
    self.getHeight = function () { return stats.height; };
    self.getThrust = function () { return stats.thrust; };
    self.getFuel = function () { return stats.fuel; };
    self.getHeat = function () { return stats.heat; };
    self.getNumOfTanks = function () { return stats.fuelTanks; };

    function norm(newStat, min) {
        var afterMin = Math.max(min || 0, Math.floor(newStat));
        if (typeof max === 'number') {
            return Math.min(max, afterMin);
        }
        return afterMin;
    }

    function move() {

        if (stats.fuel === 0) {
            stats.thrust = 0;
            if (!outOfFuel) {
                console.error('out of fuel!!! at hight:' + stats.maxHeight);
                outOfFuel = true;
                try {
                    self.onFuelOut();
                } catch (ex){

                }
            }
        }

        if (stats.heat > HEAT_LIMIT) {
            console.log(stats.thrust)
            stats.thrust = 0;
            if (!destroyed) {
                console.error('too hot!!! explosion imminent!!! at hight:' + stats.maxHeight);
                destroyed = true;

                // call the listener but don't let any errors prevent the rocket from doing it's thing.
                try {
                    self.onExplosion();

                } catch (error) {

                }
            }
        }

        var naturalCooldown = 2;
        stats.speed = stats.speed + (Math.sqrt(stats.thrust * 2)) - (GRAVITY * (1 + stats.fuelTanks * 0.25));
        if (stats.height < 0){
            stats.speed = 0;
        }
        stats.heat = norm(stats.heat + (stats.thrust / 4) - naturalCooldown);
        stats.height = norm(stats.height + stats.speed);
        if (stats.height > 0 && !takeoff){
            takeoff = true;
        }
        stats.fuel = norm(stats.fuel - thrustToFuelCost(stats.thrust));

        if (!destroyed) {
            stats.maxHeight = Math.max(stats.maxHeight, stats.height);
        }

        if (stats.speed < 0 && stats.height == 0){
            if (stats.speed < -100 && !destroyed){
                self.onExplosion();
            }
            stats.speed = 0;

        }

        if (stats.height < 0) {
            clearInterval(tickInterval)
        }

        rocket.style.bottom = (stats.height / 5) + 'px';
    }

    function dropExtraFuelTank() {
        if (stats.fuelTanks > 1){
            stats.fuelTanks--;
            stats.fuel = Math.min(stats.fuelTanks * FUEL_TANK_CAPACITY, stats.fuel);
        }
    }
    

    self.dropExtraFuelTank = makeControlFunction(dropExtraFuelTank);

    function slingshot() {
        if (stats.height === 0 && !usedSlingshot) {
            stats.speed = 20;
            usedSlingshot = true;
        }
    }

    self.slingshot = makeControlFunction(slingshot);

    function fuelToThrust(fuelSpent) {
        return fuelSpent;
    }

    function thrustToFuelCost(currThrust) {
        return currThrust;
    }

    function changeThrust(delta) {

        if (delta > 3 || delta < -3 || Math.round(delta) !== delta) {
            console.error("can't change the thrust by more than 3, less than -3 or by a float");
            return;
        }

        stats.thrust = norm(stats.thrust + delta, 0, 10);

    }

    // a single control function is alllowed to run per tick, this decorator makes sure we only run the first one that is called.
    function makeControlFunction(func) {
        return function (a) {

            if (didSomething || destroyed) return;

            func(a);
            didSomething = true;
        }
    }

    function doIfNotDestoryed(func) {
        return function (a) {

            if (destroyed) return;

            func(a);
        }
    }

    function updateLegend() {
        statElms.fuel.textContent = stats.fuel;
        statElms.fuelTanks.textContent = stats.fuelTanks + ' fuel capacity: ' + stats.fuelTanks * FUEL_TANK_CAPACITY;
        statElms.speed.textContent = stats.speed;
        statElms.thrust.textContent = stats.thrust;
        statElms.heat.textContent = stats.heat;
        statElms.height.textContent = stats.height;
        statElms.maxHeight.textContent = stats.maxHeight;
    }


    self.changeRocketImg = function (src) {
        document.querySelector('.rocket').src = src;
    };

    self.onExplosion = function noop() {
        self.changeRocketImg("./images/explosion1.gif");
     };

    self.onFuelOut = function noop() { };


    self.changeThrust = makeControlFunction(changeThrust);


    var tickInterval = setInterval(function () {

        didSomething = false;
        stats.time++;

        if (typeof control === 'function') {
            control();
        }

        move();
        updateLegend();

    }, 75)

} (rocket));