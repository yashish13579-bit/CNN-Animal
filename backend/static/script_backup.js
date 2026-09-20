const imageInput =
    document.getElementById("imageInput");

const previewContainer =
    document.getElementById("previewContainer");

const previewImage =
    document.getElementById("previewImage");

const predictBtn =
    document.getElementById("predictBtn");

const loading =
    document.getElementById("loading");

const result =
    document.getElementById("result");

const predictionText =
    document.getElementById("predictionText");

const confidenceText =
    document.getElementById("confidenceText");


let selectedImage = null;


// =============================
// IMAGE SELECT
// =============================

imageInput.addEventListener(
    "change",
    function () {

        const file = this.files[0];

        if (!file) {
            return;
        }

        selectedImage = file;


        // Show image preview

        const reader = new FileReader();

        reader.onload = function (event) {

            previewImage.src =
                event.target.result;

            previewContainer.style.display =
                "block";

            predictBtn.disabled =
                false;

            result.style.display =
                "none";
        };

        reader.readAsDataURL(file);
    }
);


// =============================
// PREDICT
// =============================

predictBtn.addEventListener(
    "click",
    async function () {

        if (!selectedImage) {
            return;
        }


        loading.style.display =
            "block";

        predictBtn.disabled =
            true;

        result.style.display =
            "none";


        // Image ko backend bhejne ke liye

        const formData =
            new FormData();

        formData.append(
            "image",
            selectedImage
        );


        try {

            const response =
                await fetch(
                    "predict",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            // Backend ka result

            predictionText.textContent =
                data.prediction;

            confidenceText.textContent =
                data.confidence + "%";


            result.style.display =
                "block";

        }

        catch (error) {

            console.error(error);

            predictionText.textContent =
                "Backend not connected";

            confidenceText.textContent =
                "-";

            result.style.display =
                "block";
        }


        finally {

            loading.style.display =
                "none";

            predictBtn.disabled =
                false;
        }

    }
);
