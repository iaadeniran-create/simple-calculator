// ======================================================
// PHOTO DATA: original locations (longitude and latitude)
// ======================================================
const photos = [
    {
        title: "Beijing Olympic Stadium",
        image: "images/Beijing Olympic Stadium.jpeg",
        longitude: 116.3906,
        latitude: 39.9913
    },
    {
        title: "Chinese Archaeological Museum",
        image: "images/Chinese Archaeological Museum.jpeg",
        longitude: 116.3795,
        latitude: 40.0005
    },
    {
        title: "Beijing Olympic Tower",
        image: "images/Beijing Olympic Tower.jpeg",
        longitude: 116.3930,
        latitude: 40.0105
    },
    {
        title: "Beijing Street View",
        image: "images/Beijing Street View.jpeg",
        longitude: 116.4010,
        latitude: 39.9950
    }
];

// ======================================================
// CONNECT TO ARCGIS MAPS SDK
// ======================================================
const [Map, MapView, Graphic] = await $arcgis.import([
    "@arcgis/core/Map.js",
    "@arcgis/core/views/MapView.js",
    "@arcgis/core/Graphic.js"
]);

// ======================================================
// CREATE THE MAP
// ======================================================
const map = new Map({ basemap: "streets-vector" });
const view = new MapView({
    container: "map",
    map: map,
    center: [116.39, 40.00],
    zoom: 13
});

const gallery = document.getElementById("gallery");

// ======================================================
// ADD A PHOTO LOCATION TO THE MAP AND GALLERY
// Used for both original and user-added locations
// ======================================================
function addPhotoLocation(photo, index) {
    const marker = new Graphic({
        geometry: {
            type: "point",
            longitude: photo.longitude,
            latitude: photo.latitude
        },
        symbol: {
            type: "picture-marker",
            url: "images/location-pin.png",
            width: "24px",
            height: "32px"
        },
        attributes: {
            photoIndex: index,
            title: photo.title
        }
    });

    view.graphics.add(marker);

    // Create a clickable thumbnail in the existing gallery
    const image = document.createElement("img");
    image.src = photo.image;
    image.alt = photo.title;
    image.className = "thumbnail";
    image.onclick = function() {
        showPhoto(index);
    };
    gallery.appendChild(image);
}

// Add the four original locations
photos.forEach(function(photo, index) {
    addPhotoLocation(photo, index);
});

// ======================================================
// SHOW THE SELECTED PHOTO AND HIGHLIGHT ITS THUMBNAIL
// ======================================================
function showPhoto(index) {
    const photo = photos[index];
    if (!photo) return;

    document.getElementById("selected-photo").src = photo.image;
    document.getElementById("selected-photo").alt = photo.title;
    document.getElementById("photo-title").textContent = photo.title;

    const thumbnails = document.querySelectorAll(".thumbnail");
    thumbnails.forEach(function(thumbnail) {
        thumbnail.classList.remove("selected");
    });
    if (thumbnails[index]) {
        thumbnails[index].classList.add("selected");
    }
}

// ======================================================
// CLICK A MARKER TO SHOW ITS PHOTO
// ======================================================
view.on("click", async function(event) {
    const response = await view.hitTest(event, {
        include: view.graphics
    });

    // Only respond to markers linked to our photo data
    for (const result of response.results) {
        const index = result.graphic?.attributes?.photoIndex;
        if (Number.isInteger(index)) {
            showPhoto(index);
            break;
        }
    }
});

// Display the first photo when the app opens
showPhoto(0);

// ======================================================
// COLLAPSE AND EXPAND THE PHOTO GALLERY
// ======================================================
const gallerySection = document.getElementById("gallery-section");
const galleryToggle = document.getElementById("gallery-toggle");

galleryToggle.onclick = function() {
    gallerySection.classList.toggle("collapsed");
};

// ======================================================
// ACCEPT A NEW LOCATION FROM THE USER
// No UTM X/Y values are needed for adding map markers.
// ======================================================
const locationForm = document.getElementById("location-form");
const formMessage = document.getElementById("form-message");

locationForm.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the page from reloading

    // Read the values from the HTML form
    const title = document.getElementById("location-title").value.trim();
    const imageFile = document.getElementById("location-image").files[0];
    const longitudeText = document.getElementById("location-longitude").value;
    const latitudeText = document.getElementById("location-latitude").value;
    const longitude = Number(longitudeText);
    const latitude = Number(latitudeText);

    // Check that the user entered valid information
    if (!title || !imageFile || !imageFile.type.startsWith("image/") ||
        longitudeText === "" || latitudeText === "" ||
        !Number.isFinite(longitude) || !Number.isFinite(latitude) ||
        longitude < -180 || longitude > 180 ||
        latitude < -90 || latitude > 90) {
        formMessage.textContent = "Please enter a title, image, and valid longitude/latitude.";
        formMessage.className = "error";
        return;
    }

    // Make the selected local image available to the browser
    const imageURL = URL.createObjectURL(imageFile);

    // Store the new location with the existing locations
    const newPhoto = {
        title: title,
        image: imageURL,
        longitude: longitude,
        latitude: latitude
    };
    photos.push(newPhoto);
    const newIndex = photos.length - 1;

    // Add the new location to the map and photo gallery
    addPhotoLocation(newPhoto, newIndex);
    showPhoto(newIndex);

    // Move the map to the new location
    view.goTo({ center: [longitude, latitude], zoom: 14 }).catch(function(error) {
        if (error.name !== "AbortError") console.error(error);
    });

    formMessage.textContent = title + " was added to the map!";
    formMessage.className = "success";
    locationForm.reset();
});
