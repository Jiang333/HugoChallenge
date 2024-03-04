import db from '../db';

export async function createApplication(req) {
    console.log(req);
    try {
        const application = await db.application.create({
            data: {
                firstName: req.firstName,
                lastName: req.lastName,
                dateOfBirth: new Date(req.dateOfBirth),
                address: {
                    create: req.address,
                },
                vehicles: {
                    create: req.vehicles,
                },
            },
        });
        console.log(application);
        return application;
    } catch (error) {
        console.error(error);
    }
}

export async function updateApplication(id, req) {
    try {
        const updateData = {};

        // Dynamically add fields to the updateData object if they are present in the request
        if (req.firstName) updateData.firstName = req.firstName;
        if (req.lastName) updateData.lastName = req.lastName;
        if (req.dateOfBirth) updateData.dateOfBirth = new Date(req.dateOfBirth);

        // Update address separately assumingreq.address has an ID
        if (req.address.id) {
            const updatedAddress = await db.address.update({
                where: { id: parseInt(req.address.id, 10) },
                data: req.address,
            });
        } else {
            updateData.address = {
                update: req.address,
            };
        }
        const currentVehicles = await db.vehicle.findMany({
            where: { applicationId: parseInt(id, 10) },
        });
        /*
        Current iteration of cars on the policy is to remove cars that are no longer in the array of the profile
        This should cause issues if the partial data is given and the vehicle data is incomplete or empty as cars would
        be deleted from the policy
        */
        const incomingVehicleIds = req.vehicles.map((vehicle) => vehicle.id);

        const vehiclesToUpdate = req.vehicles.filter(
            (vehicle) => vehicle.id && currentVehicles.some((v) => v.id === vehicle.id)
        );
        const vehiclesToCreate = req.vehicles.filter((vehicle) => !vehicle.id);
        const vehiclesToDelete = currentVehicles.filter(
            (vehicle) => !incomingVehicleIds.includes(vehicle.id)
        );
        // Update existing vehicles
        if (vehiclesToUpdate.length > 0) {
            // Loop through each vehicle to update and call 'update' for each
            const updatePromises = vehiclesToUpdate.map((vehicle) => {
                return db.vehicle.update({
                    where: { id: parseInt(vehicle.id, 10) },
                    data: {
                        vin: vehicle.vin,
                        make: vehicle.make,
                        model: vehicle.model,
                        year: vehicle.year,
                    },
                });
            });

            // Wait for all update operations to complete
            await Promise.all(updatePromises);
        }

        // Create new vehicles
        for (const vehicle of vehiclesToCreate) {
            await db.vehicle.create({
                data: {
                    ...vehicle,
                    applicationId: parseInt(id, 10),
                },
            });
        }

        // Delete vehicles not included in the request
        if (vehiclesToDelete.length > 0) {
            await db.vehicle.deleteMany({
                where: { id: { in: vehiclesToDelete.map((vehicle) => parseInt(vehicle.id, 10)) } },
            });
        }

        // Use the updateData object in the Prisma update method
        const updatedApplication = await db.application.update({
            where: { id: parseInt(id, 10) },
            data: updateData,
        });
        const application = await db.application.findUnique({
            where: {
                id: parseInt(id, 10),
            },
            include: {
                vehicles: true,
                address: true,
            },
        });

        console.log(application);
    } catch (error) {
        console.error(error);
    }
}

export async function findApplication(req) {
    try {
        const application = await db.application.findUnique({
            where: {
                id: parseInt(req.params.id, 10),
            },
            include: {
                vehicles: true,
                address: true,
            },
        });

        console.log(application);
        return application;
    } catch (error) {
        console.error(error);
    }
}
