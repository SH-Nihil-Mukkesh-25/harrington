const TN_GRAPH = {
    "Chennai": {
        "Trichy": { dist: 330, tollCar: 480, tollTruck: 195, highway: "NH45", fuelCost: 5940 },
        "Coimbatore": { dist: 510, tollCar: 650, tollTruck: 685, highway: "NH544", fuelCost: 9180 }
    },
    "Trichy": {
        "Madurai": { dist: 135, tollCar: 210, tollTruck: 100, highway: "NH38", fuelCost: 2430 },
        "Chennai": { dist: 330, tollCar: 480, tollTruck: 195, highway: "NH45", fuelCost: 5940 }
    },
    "Madurai": {
        "Tuticorin": { dist: 150, tollCar: 150, tollTruck: 90, highway: "NH38", fuelCost: 2700 },
        "Trichy": { dist: 135, tollCar: 210, tollTruck: 100, highway: "NH38", fuelCost: 2430 },
        "Coimbatore": { dist: 210, tollCar: 180, tollTruck: 115, highway: "NH83", fuelCost: 3780 }
    },
    "Coimbatore": {
        "Madurai": { dist: 210, tollCar: 180, tollTruck: 115, highway: "NH83", fuelCost: 3780 },
        "Chennai": { dist: 510, tollCar: 650, tollTruck: 685, highway: "NH544", fuelCost: 9180 }
    },
    "Tuticorin": {
        "Madurai": { dist: 150, tollCar: 150, tollTruck: 90, highway: "NH38", fuelCost: 2700 }
    },
    "Salem": {
        // Placeholder for future expansion
    }
};

module.exports = TN_GRAPH;
