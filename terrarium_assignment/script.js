// Drag & Drop API + 감속 효과 🌿

// 모든 식물 가져오기
const plants = document.querySelectorAll(".plant");

// draggable 속성 및 이벤트 부여
plants.forEach((plant) => {
  plant.setAttribute("draggable", true);

  plant.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", e.target.id);
    e.target.classList.add("dragging");
  });

  plant.addEventListener("dragend", (e) => {
    e.target.classList.remove("dragging");
  });
});

// 드롭 가능한 영역 지정
const dropZones = document.querySelectorAll("#terrarium, #left-container, #right-container");

dropZones.forEach((zone) => {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();

    const plantId = e.dataTransfer.getData("text/plain");
    const plant = document.getElementById(plantId);

    // 병 안으로 들어갈 때
    if (zone.id === "terrarium") {
      const rect = zone.getBoundingClientRect();
      const x = e.clientX - rect.left - plant.width / 2;
      const y = e.clientY - rect.top - plant.height / 2;

      plant.style.position = "absolute";
      plant.style.left = `${x}px`;
      plant.style.top = `${y}px`;
      plant.style.width = "150px";
      plant.style.zIndex = 10;
      plant.style.transition = "transform 0.4s ease-out, top 0.4s ease-out, left 0.4s ease-out";

      // 감속 효과 강조
      plant.classList.add("smooth-drop");
      setTimeout(() => plant.classList.remove("smooth-drop"), 400);

      zone.appendChild(plant);
    } else {
      // 양쪽 컨테이너로 이동 시
      plant.style.position = "relative";
      plant.style.left = "0";
      plant.style.top = "0";
      plant.style.width = "100%";
      plant.style.zIndex = 2;
      plant.style.transition = "none";

      const holder = document.createElement("div");
      holder.classList.add("plant-holder");
      holder.appendChild(plant);
      zone.appendChild(holder);
    }
  });
});
