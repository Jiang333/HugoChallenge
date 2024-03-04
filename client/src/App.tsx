import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { api, states, currentYear } from './util.tsx';
import './App.css';

type Application = {
    firstName: String;
    lastName: String;
    dateOfBirth: Date;
    address: Address;
    vehicles: Vehicles[];
    members: Members[];
};
type Address = {
    addressLine: String;
    city: String;
    state: String;
    zipCode: String;
};

type Vehicle = {
    vin: Int;
    year: String;
    make: String;
    model: String;
};
type Member = {
    firstName: String;
    lastName: String;
    dateOfBirth: Date;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<ApplicationForm />} />
                <Route path="/:id" element={<ApplicationForm />} />
            </Routes>
        </Router>
    );
}

function ApplicationForm() {
    const [quoteData, setQuoteData] = useState(null);
    const { id } = useParams(); // Access the id parameter from the route
    const navigate = useNavigate();

    //update the page to load data is there is an id param
    useEffect(() => {
        if (id) {
            // Check if the id parameter exists
            const fetchApplicationData = async () => {
                try {
                    const response = await fetch(`${api}/applications/${id}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    if (data.app == null) {
                        navigate('/');
                        return;
                    }
                    const { firstName, lastName, dateOfBirth, vehicles, address } = data.app;
                    setValue('firstName', firstName);
                    setValue('lastName', lastName);
                    setValue('dateOfBirth', dateOfBirth.split('T')[0]);
                    setValue('vehicles', vehicles);
                    setValue('address', address);
                } catch (error) {
                    console.error('There was a problem with your fetch operation:', error);
                }
            };

            fetchApplicationData();
        }
    }, [id]);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<Application>();

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'vehicles',
    });

    /* On submit will be able to handle both cases of creating a new applicationa and updating one.
        It has also been setup to post the completed application for the quoted price.
     */
    const onSubmit: SubmitHandler<Application> = async (data) => {
        const hasVehicle = data.vehicles.some((vehicle) =>
            Object.values(vehicle).some((field) => field !== '')
        );
        if (!hasVehicle) {
            alert('Please fill out at least one vehicle.');
            return;
        }
        const method = id ? 'PUT' : 'POST'; // Determine the HTTP method
        const url = id ? `${api}/applications/${id}` : `${api}/applications`;
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const responseData = await response.json();
            console.log(responseData);

            if (method === 'POST' && responseData.id) {
                navigate(`/${responseData.id}`);
            }
            const quoteResponse = await fetch(`${api}/applications/${parseInt(id, 10)}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(response.data),
            });
            const quoteData = await quoteResponse.json();
            console.log(quoteData);
            if (quoteData.quote) {
                setQuoteData(quoteData.quote);
            }
        } catch (error) {
            console.error('There was a problem with your fetch operation:', error);
        }
    };

    /*There are some issues with error messages not appearing consistently.
    Probably could split up the form into smaller components and setup a better UI/UX
    */
    return (
        <>
            <form onSubmit={handleSubmit(onSubmit)}>
                <label>First Name:</label>
                <input
                    defaultValue=""
                    {...register('firstName', { required: 'First Name is required' })}
                />
                {errors.firstName && <p>{errors.firstName.message}</p>}
                <br />
                <label>Last Name:</label>
                <input
                    defaultValue=""
                    {...register('lastName', { required: 'Last Name is required' })}
                />
                {errors.lastName && <p>{errors.lastName.message}</p>}
                <br />
                <label>Date of Birth:</label>
                <input
                    type="date"
                    {...register('dateOfBirth', {
                        required: 'Date of Birth is required',
                        validate: {
                            isAtLeast16: (value) => {
                                const dob = new Date(value);
                                const today = new Date();
                                let age = today.getFullYear() - dob.getFullYear();
                                const m = today.getMonth() - dob.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                                    age--;
                                }
                                return age >= 16 || 'You must be at least 16 years old';
                            },
                            validDate: (value) =>
                                !isNaN(Date.parse(value)) || 'Please enter a valid date',
                            notFutureDate: (value) =>
                                new Date(value) <= new Date() || 'Date cannot be in the future',
                        },
                    })}
                />
                {errors.dateOfBirth && <p>{errors.dateOfBirth.message}</p>}
                <br />
                <label>Address Line:</label>
                <input
                    defaultValue=""
                    {...register('address.addressLine', { required: 'Address is required' })}
                />
                {errors.address?.addressLine && <p>{errors.address.addressLine.message}</p>}
                <br />
                <label>City:</label>
                <input
                    defaultValue=""
                    {...register('address.city', { required: 'City is required' })}
                />
                {errors.address?.city && <p>{errors.address.city.message}</p>}
                <br />
                <label>State:</label>
                <select
                    id="state"
                    {...register('address.state', {
                        required: 'State is required',
                        validate: {
                            isState: (value) => {
                                return value !== '' || 'State is required';
                            },
                        },
                    })}
                >
                    {states.map((state) => (
                        <option key={state} value={state}>
                            {state}
                        </option>
                    ))}
                </select>
                {errors.address?.state && <p>{errors.address.state.message}</p>}
                <br />
                <label>Zipcode:</label>
                <input
                    defaultValue=""
                    {...register('address.zipCode', { required: 'Zipcode is required',
                    pattern: {
                        value: /^\d{5}$/, // Use regex to validate 5-digit numeric ZIP code
                        message: 'Invalid ZIP code format'
                      }
                })}
                />
                {errors.address?.zipCode && <p>{errors.address.zipCode.message}</p>}
                <br />
                {fields.map((field, index) => (
                    <div key={field.id}>
                        <h3>Vehicle {index + 1}</h3>
                        <div>
                            <label>VIN:</label>
                            <input
                                {...register(`vehicles.${index}.vin`, {
                                    required: 'VIN is required',
                                })}
                            />
                            {errors.vehicles && errors.vehicles[index]?.vin && (
                                <p>{errors.vehicles[index].vin.message}</p>
                            )}
                        </div>
                        <div>
                            <label>Make:</label>
                            <input
                                {...register(`vehicles.${index}.make`, {
                                    required: 'Make is required',
                                })}
                            />
                            {errors.vehicles && errors.vehicles[index]?.make && (
                                <p>{errors.vehicles[index].make.message}</p>
                            )}
                        </div>
                        <div>
                            <label>Model:</label>
                            <input
                                {...register(`vehicles.${index}.model`, {
                                    required: 'Model is required',
                                })}
                            />
                            {errors.vehicles && errors.vehicles[index]?.model && (
                                <p>{errors.vehicles[index].model.message}</p>
                            )}
                        </div>
                        <div>
                            <label>Year:</label>
                            <input
                                type="number"
                                {...register(
                                    `vehicles.${index}.year`,
                                    { min: 1985, max: currentYear + 1 },
                                    {
                                        required: `Year is required to be between 1985 and ${currentYear + 1}`,
                                    }
                                )}
                            />
                            {errors.vehicles && errors.vehicles[index]?.year && (
                                <p>{errors.vehicles[index].year.message}</p>
                            )}
                        </div>
                        <button type="button" onClick={() => remove(index)}>
                            Remove Vehicle
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() =>
                        fields.length < 3 && append({ vin: '', make: '', model: '', year: '' })
                    }
                >
                    Add Vehicle
                </button>

                <br />
                <button type="submit">Submit</button>
            </form>
            {quoteData != null && <h3>Your Quote is: ${quoteData}</h3>}
        </>
    );
}

export default App;
