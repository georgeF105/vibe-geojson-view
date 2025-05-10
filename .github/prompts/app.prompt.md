# Base instructions

- Create full MVP, don't stop until it's done. Don't wait for my feedback, don't ask me to continue, just do it.
- Create it in the current folder, don't create a new folder.
- Use MapLibre

# MVP

## Features

- Create a React app for viewing GIS data from a GeoJSON file.

## User flow

- User uploads one or multiple GeoJSON files.
- A map is shown, and the user is zoomed to the location of the features.
- The features are shown on the map in 2D.

## Technical Details

### Frameworks and Libraries

- Use React for building the user interface.
- Use MapLibre GL JS for rendering the map and displaying GeoJSON features.
- Use a file input component for uploading GeoJSON files.

### Implementation Steps

1. **Setup React App**:

- Initialize a new React app in the current folder using `vite`.
- Install necessary dependencies: `maplibre-gl`, `react-map-gl`, and any other required libraries.

2. **File Upload**:

- Create a file input component to allow users to upload one or multiple GeoJSON files.
- Parse the uploaded files to validate they are in GeoJSON format.

3. **Map Integration**:

- Initialize a MapLibre map component.
- Add functionality to load GeoJSON data onto the map.
- Automatically zoom and center the map to the bounding box of the uploaded GeoJSON features.

4. **Feature Display**:

- Render the GeoJSON features in 2D on the map.
- Style the features with default colors and provide basic interactivity (e.g., hover or click to highlight).

5. **Error Handling**:

- Display user-friendly error messages for invalid GeoJSON files or upload issues.

6. **Testing**:

- Test the app with various GeoJSON files to ensure compatibility and performance.

### Additional Notes

- Ensure the app is responsive and works on both desktop and mobile devices.
- Follow best practices for React and MapLibre development.
- Provide comments in the code for clarity and maintainability.
- Use a simple and clean UI design to focus on functionality.
- Optionally, include a button to clear the map and reset the app state.
