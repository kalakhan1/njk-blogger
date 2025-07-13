const ENDPOINT = "https://script.google.com/macros/s/AKfycbyfLqoYInc6hMXn5Bsbh8VUPlbcDZO7LiYgwHggdEYrRU-1HMYogLBOu0gPAS94AMNo/exec";

// --- SPA Navigation Logic ---
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top when changing page

  // Trigger data loading when a page is shown for the first time or re-shown
  if (pageId === 'archive-section') {
    if (!document.getElementById('archiveList').hasChildNodes()) { // Only load if not already loaded
      loadPostsArchive();
    }
  } else if (pageId === 'recent-carousel-section') {
    if (!document.getElementById('carousel').hasChildNodes() || document.getElementById('carousel').querySelector('.no-data')) { // Only load if not already loaded or if no data was found previously
      loadCarouselRecent();
    }
  } else if (pageId === 'magazine-table-section') {
    if (!document.getElementById('propertyTableMagazine').hasChildNodes()) { // Only load if not already loaded
      fetchDataMagazine();
    }
  }
}

// --- Page 1: Submit Property Logic ---
const typeFieldSubmit = document.getElementById('type');
const bedBathDivSubmit = document.getElementById('bedBath');

typeFieldSubmit.addEventListener('change', () => {
  const val = typeFieldSubmit.value;
  if (val === 'Bungalow' || val === 'Flat') {
    bedBathDivSubmit.classList.remove('hidden');
  } else {
    bedBathDivSubmit.classList.add('hidden');
  }
});

document.getElementById("propertyForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  fetch(ENDPOINT, {
    method: "POST",
    body: data
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === "success") {
      document.getElementById("submitMsg").style.display = "block";
      form.reset();
      bedBathDivSubmit.classList.add('hidden');
      // Optionally reload data for other sections after submission
      loadPostsArchive();
      loadCarouselRecent();
      fetchDataMagazine();
    } else {
      alert("❌ Failed to submit: " + res.message);
    }
  })
  .catch(err => {
    alert("❌ Submission Error");
    console.error(err);
  });
});

// --- Conditional Bedrooms Filter Visibility ---
function toggleBedroomsFilter(section) {
  const typeSelect = document.getElementById(`filterType${section.charAt(0).toUpperCase() + section.slice(1)}`);
  const bedroomsFilterDiv = document.getElementById(`bedroomsFilter${section.charAt(0).toUpperCase() + section.slice(1)}`);

  if (typeSelect.value === 'Bungalow' || typeSelect.value === 'Flat') {
    bedroomsFilterDiv.style.display = 'block'; // Show the filter
  } else {
    bedroomsFilterDiv.style.display = 'none'; // Hide the filter
    // Optionally clear the bedrooms input when hidden
    const bedroomsInput = bedroomsFilterDiv.querySelector('input[type="number"]');
    if (bedroomsInput) bedroomsInput.value = '';
  }
}

// --- Common Filter Clear Function ---
function clearFilters(section) {
  const filterPrefix = section.charAt(0).toUpperCase() + section.slice(1);
  const filterIds = [
    `filterType${filterPrefix}`, `filterPurpose${filterPrefix}`,
    `filterLocation${filterPrefix}`, `filterBedrooms${filterPrefix}`,
    `minArea${filterPrefix}`, `maxArea${filterPrefix}`,
    `keyword${filterPrefix}`, `filterDate${filterPrefix}`,
    `minPrice${filterPrefix}`, `maxPrice${filterPrefix}`
  ];
  filterIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (element.tagName === 'SELECT') {
        element.value = ''; // Reset select to first option (All)
      } else if (element.type === 'date' || element.type === 'text' || element.type === 'number') {
        element.value = ''; // Clear text/number/date inputs
      }
    }
  });
  // Ensure bedrooms filter is hidden if type is not Bungalow/Flat after clearing
  toggleBedroomsFilter(section.toLowerCase()); // Pass lower case like 'archive'
}

// --- Common View Card for Archive, Recent, Magazine ---
function viewCommonCard(post) {
  const phone = post.Contact.toString().replace(/[^0-9]/g, "");

  let bedroomInfo = '';
  let bathroomInfo = '';
  if (post.Type === 'Bungalow' || post.Type === 'Flat') {
      bedroomInfo = `Bedrooms: ${post.Bedrooms || 'N/A'}\n`;
      bathroomInfo = `Bathrooms: ${post.Bathrooms || 'N/A'}\n`;
  }

  const fullDetails = `Hello ${post.Agent},\n\nI'm interested in your property ad:\n\n` +
                      `Title: ${post.Title}\n` +
                      `Description: ${post.Description}\n` +
                      `Type: ${post.Type}\n` +
                      `Purpose: ${post.Purpose}\n` +
                      `Location: ${post.Location} ${post.LocationInput || ''}\n` +
                      `Area: ${post.AreaValue} ${post.AreaUnit}\n` +
                      `${bedroomInfo}` + // Conditionally add bedroom info for WhatsApp
                      `${bathroomInfo}` + // Conditionally add bathroom info for WhatsApp
                      `Price: ${post.Price}\n` +
                      `Agency: ${post.Agency}\n` +
                      `Posted On: ${new Date(post.Date).toLocaleDateString()}\n\n` +
                      `Please share more details.`;

  const message = encodeURIComponent(fullDetails);
  const link = phone.length >= 10 ? `https://wa.me/${phone}?text=${message}` : `sms:${phone}?body=${message}`;

  // Build HTML for the card, conditionally including bedrooms/bathrooms for the popup view
  let cardDetailsHTML = `
    <h4>${post.Title}</h4>
    <p><strong>Description:</strong> ${post.Description}</p>
    <p><strong>Type:</strong> ${post.Type}</p>
    <p><strong>Purpose:</strong> ${post.Purpose}</p>
    <p><strong>Area:</strong> ${post.AreaValue} ${post.AreaUnit}</p>
  `;
  if (post.Type === 'Bungalow' || post.Type === 'Flat') {
    cardDetailsHTML += `<p><strong>Bedrooms:</strong> ${post.Bedrooms || 'N/A'}</p>
                       <p><strong>Bathrooms:</strong> ${post.Bathrooms || 'N/A'}</p>`;
  }
  cardDetailsHTML += `
    <p><strong>Agency:</strong> ${post.Agency}</p>
    <p><strong>Agent:</strong> ${post.Agent}</p>
    <p><strong>Contact:</strong> ${post.Contact || 'N/A'}</p> <p><strong>Posted On:</strong> ${new Date(post.Date).toLocaleDateString()}</p>
    <a href="${link}" class="btn btn-success w-100" target="_blank">Contact via WhatsApp</a>`;

  document.getElementById("commonCardDetails").innerHTML = cardDetailsHTML;
  document.getElementById("commonViewCard").style.display = "flex";
}

function closeCommonView() {
  document.getElementById("commonViewCard").style.display = "none";
}

// --- Page 2: Archive Logic ---
let allPostsArchive = [], filteredPostsArchive = [], currentPageArchive = 1;
const perPageArchive = 21;

async function loadPostsArchive() {
  try {
    const res = await fetch(ENDPOINT);
    const json = await res.json();
    if (json.status === "success") {
      allPostsArchive = json.data.reverse();
      populateLocationSuggestions('archive', allPostsArchive);
      applyFiltersArchive(); // Apply filters immediately after loading, including default date
    } else {
      document.getElementById("archiveList").innerHTML = '<div class="no-data">Failed to load posts.</div>';
    }
  } catch (error) {
    console.error("Fetch failed for Archive:", error);
    document.getElementById("archiveList").innerHTML = '<div class="no-data">Error loading posts. Please try again later.</div>';
  }
}

function renderListArchive() {
  const start = (currentPageArchive - 1) * perPageArchive;
  const paginated = filteredPostsArchive.slice(start, start + perPageArchive);
  const list = document.getElementById("archiveList");
  list.innerHTML = paginated.map(post => `
    <div class="archive-item">
      <h5>${post.Title}</h5>
      <p><strong>Type:</strong> ${post.Type}</p>
      <p><strong>Area:</strong> ${post.AreaValue || 'N/A'} ${post.AreaUnit || ''}</p>
      <p><strong>Price:</strong> ${post.Price}</p>
      <p><strong>Location:</strong> ${post.Location} ${post.LocationInput || ''}</p>
      <button class="btn btn-sm btn-outline-success" onclick='viewCommonCard(${JSON.stringify(post)})'>View</button>
    </div>`).join("");
  renderPaginationArchive();
}

function renderPaginationArchive() {
  const total = Math.ceil(filteredPostsArchive.length / perPageArchive);
  const pagination = document.getElementById("paginationArchive");
  pagination.innerHTML = "";
  for (let i = 1; i <= total; i++) {
    pagination.innerHTML += `<li class="page-item ${i === currentPageArchive ? 'active' : ''}"><a class="page-link" href="#" onclick="gotoPageArchive(${i})">${i}</a></li>`;
  }
}

function gotoPageArchive(p) {
  currentPageArchive = p;
  renderListArchive();
  document.getElementById('archive-section').scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top of section
}

function applyFiltersArchive() {
  const type = document.getElementById("filterTypeArchive").value;
  const purpose = document.getElementById("filterPurposeArchive").value;
  const location = document.getElementById("filterLocationArchive").value.toLowerCase();
  const keyword = document.getElementById("keywordArchive").value.toLowerCase();
  const dateFilter = document.getElementById("filterDateArchive").value;
  const minPrice = document.getElementById("minPriceArchive").value;
  const maxPrice = document.getElementById("maxPriceArchive").value;
  const bedrooms = document.getElementById("filterBedroomsArchive").value;
  const minArea = document.getElementById("minAreaArchive").value;
  const maxArea = document.getElementById("maxAreaArchive").value;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  filteredPostsArchive = allPostsArchive.filter(post => {
    const loc = `${post.Location} ${post.LocationInput || ''}`.toLowerCase();
    const postDate = new Date(post.Date);
    const price = parseFloat(post.Price) || 0;
    const postBedrooms = parseInt(post.Bedrooms || 0);
    const postAreaValue = parseFloat(post.AreaValue) || 0;

    let dateCondition = true;
    if (dateFilter) {
      dateCondition = postDate.toISOString().split("T")[0] === dateFilter;
    } else {
      // Default: only show posts from the last 30 days if no specific date is picked
      dateCondition = postDate >= thirtyDaysAgo;
    }

    let bedroomCondition = true;
    if (type === 'Bungalow' || type === 'Flat') {
        bedroomCondition = bedrooms === "" || postBedrooms === parseInt(bedrooms);
    }

    return (
      (type === "" || post.Type === type) &&
      (purpose === "" || post.Purpose === purpose) &&
      (location === "" || loc.includes(location)) &&
      (keyword === "" || (post.Description && post.Description.toLowerCase().includes(keyword))) &&
      (dateCondition) &&
      (minPrice === "" || price >= parseFloat(minPrice)) &&
      (maxPrice === "" || price <= parseFloat(maxPrice)) &&
      (bedroomCondition) && // Use the conditional bedroom
      (minArea === "" || postAreaValue >= parseFloat(minArea)) &&
      (maxArea === "" || postAreaValue <= parseFloat(maxArea))
    );
  });
  currentPageArchive = 1;
  renderListArchive();
  clearFilters('Archive'); // Clear filters after applying
}

// --- Page 3: Recent Carousel Logic ---
let allPostsCarousel = [];

async function loadCarouselRecent() {
  try {
    const res = await fetch(ENDPOINT);
    const json = await res.json();
    if (json.status === "success" && json.data.length > 0) {
      allPostsCarousel = json.data.reverse().slice(0, 30); // Limit to 30 recent posts
      populateLocationSuggestions('carousel', allPostsCarousel);
      renderCarouselRecent(allPostsCarousel); // Initial render without filters
    } else {
      renderCarouselRecent([]);
    }
  } catch (error) {
    console.error("Fetch failed for Carousel:", error);
    document.getElementById("carousel").innerHTML = '<div class="no-data">Error loading recent posts.</div>';
  }
}

function renderCarouselRecent(data) {
  const container = document.getElementById("carousel");
  container.innerHTML = "";
  if (data.length === 0) {
    container.innerHTML = '<div class="no-data">No recent records found.</div>';
    return;
  }
  data.forEach(post => {
    const card = document.createElement("div");
    card.className = "carousel-card";
    card.innerHTML = `
      <h5>${post.Title}</h5>
      <p><strong>Type:</strong> ${post.Type}</p>
      <p><strong>Area:</strong> ${post.AreaValue || 'N/A'} ${post.AreaUnit || ''}</p>
      <p><strong>Price:</strong> ${post.Price}</p>
      <p><strong>Location:</strong> ${post.Location} ${post.LocationInput || ''}</p>
      <p><strong>Purpose:</strong> ${post.Purpose}</p>
      <button class="btn btn-outline-primary btn-sm view-btn" onclick='viewCommonCard(${JSON.stringify(post)})'>View</button>
    `;
    container.appendChild(card);
  });
}

function applyCarouselFilters() {
  const type = document.getElementById("filterTypeCarousel").value;
  const purpose = document.getElementById("filterPurposeCarousel").value;
  const location = document.getElementById("filterLocationCarousel").value.toLowerCase();
  const keyword = document.getElementById("keywordCarousel").value.toLowerCase();
  const bedrooms = document.getElementById("filterBedroomsCarousel").value;
  const minArea = document.getElementById("minAreaCarousel").value;
  const maxArea = document.getElementById("maxAreaCarousel").value;

  const filtered = allPostsCarousel.filter(post => {
    const loc = `${post.Location} ${post.LocationInput || ''}`.toLowerCase();
    const postBedrooms = parseInt(post.Bedrooms || 0);
    const postAreaValue = parseFloat(post.AreaValue) || 0;

    let bedroomCondition = true;
    if (type === 'Bungalow' || type === 'Flat') {
        bedroomCondition = bedrooms === "" || postBedrooms === parseInt(bedrooms);
    }

    return (
      (type === "" || post.Type === type) &&
      (purpose === "" || post.Purpose === purpose) &&
      (location === "" || loc.includes(location)) &&
      (keyword === "" || (post.Description && post.Description.toLowerCase().includes(keyword))) &&
      (bedroomCondition) && // Use the conditional bedroom
      (minArea === "" || postAreaValue >= parseFloat(minArea)) &&
      (maxArea === "" || postAreaValue <= parseFloat(maxArea))
    );
  });
  renderCarouselRecent(filtered);
  document.getElementById('recent-carousel-section').scrollTo({ top: document.getElementById("carousel").offsetTop - 40, behavior: "smooth" });
  clearFilters('Carousel'); // Clear filters after applying
}

// --- Page 4: Magazine Table Logic ---
const ITEMS_PER_PAGE_MAGAZINE = 10;
let currentPageMagazine = 1;
let allDataMagazine = [], filteredDataMagazine = [];

async function fetchDataMagazine() {
  try {
    const res = await fetch(ENDPOINT);
    const json = await res.json();
    if (json.status === "success") {
      allDataMagazine = json.data.reverse();
      populateLocationSuggestions('magazine', allDataMagazine);
      applyFiltersMagazine(); // Apply filters immediately after loading, including default date
    } else {
      document.getElementById("propertyTableMagazine").innerHTML = '<tr><td colspan="9" class="text-center">Failed to load data.</td></tr>';
    }
  } catch (error) {
    console.error("Fetch failed for Magazine Table:", error);
    document.getElementById("propertyTableMagazine").innerHTML = '<tr><td colspan="9" class="text-center">Error loading data. Please try again later.</td></tr>';
  }
}

function populateLocationSuggestions(section, data) {
  const locationSet = new Set();
  data.forEach(item => {
    const fullLoc = `${item.Location} ${item.LocationInput || ''}`.trim();
    if (fullLoc) locationSet.add(fullLoc);
  });
  const datalist = document.getElementById(`locationList${section.charAt(0).toUpperCase() + section.slice(1)}`);
  if (datalist) { // Ensure datalist exists
    datalist.innerHTML = "";
    [...locationSet].forEach(loc => {
      const option = document.createElement("option");
      option.value = loc;
      datalist.appendChild(option);
    });
  }
}


function applyFiltersMagazine() {
  const type = document.getElementById("filterTypeMagazine").value;
  const purpose = document.getElementById("filterPurposeMagazine").value;
  const minPrice = document.getElementById("minPriceMagazine").value;
  const maxPrice = document.getElementById("maxPriceMagazine").value;
  const bedrooms = document.getElementById("bedroomCountMagazine").value;
  const minArea = document.getElementById("minAreaMagazine").value;
  const maxArea = document.getElementById("maxAreaMagazine").value;
  const location = document.getElementById("filterLocationMagazine").value.toLowerCase();
  const keyword = document.getElementById("keywordMagazine").value.toLowerCase();
  const dateFilter = document.getElementById("filterDateMagazine").value;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  filteredDataMagazine = allDataMagazine.filter(item => {
    const fullLoc = `${item.Location} ${item.LocationInput || ''}`.toLowerCase();
    const price = parseFloat(item.Price) || 0;
    const postBedrooms = parseInt(item.Bedrooms || 0);
    const postAreaValue = parseFloat(item.AreaValue) || 0;
    const postDate = new Date(item.Date);

    let dateCondition = true;
    if (dateFilter) {
      dateCondition = postDate.toISOString().split("T")[0] === dateFilter;
    } else {
      // Default: only show posts from the last 30 days if no specific date is picked
      dateCondition = postDate >= thirtyDaysAgo;
    }

    let bedroomCondition = true;
    if (type === 'Bungalow' || type === 'Flat') {
        bedroomCondition = bedrooms === "" || postBedrooms === parseInt(bedrooms);
    }

    return (
      (type === "" || item.Type === type) &&
      (purpose === "" || item.Purpose === purpose) &&
      (minPrice === "" || price >= parseFloat(minPrice)) &&
      (maxPrice === "" || price <= parseFloat(maxPrice)) &&
      (bedroomCondition) && // Use the conditional bedroom
      (minArea === "" || postAreaValue >= parseFloat(minArea)) &&
      (maxArea === "" || postAreaValue <= parseFloat(maxArea)) &&
      (location === "" || fullLoc.includes(location)) &&
      (keyword === "" || (item.Description && item.Description.toLowerCase().includes(keyword))) &&
      (dateCondition)
    );
  });
  currentPageMagazine = 1;
  renderPageMagazine(currentPageMagazine);
  renderPaginationMagazine();
  clearFilters('Magazine'); // Clear filters after applying
}

function renderPageMagazine(page) {
  const start = (page - 1) * ITEMS_PER_PAGE_MAGAZINE;
  const end = start + ITEMS_PER_PAGE_MAGAZINE;
  const items = filteredDataMagazine.slice(start, end);
  const tbody = document.getElementById("propertyTableMagazine");
  tbody.innerHTML = "";
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center">No records found matching filters.</td></tr>';
    return;
  }
  items.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.Title}</td>
      <td>${item.Type}</td>
      <td>${item.Purpose}</td>
      <td>${item.AreaValue || 'N/A'} ${item.AreaUnit || ''}</td>
      <td>${item.Price}</td>
      <td>${item.Location} ${item.LocationInput || ''}</td>
      <td>${item.Agency}</td>
      <td>${item.Agent}</td>
      <td><button class="btn btn-sm btn-primary" onclick='viewCommonCard(${JSON.stringify(item)})'>View</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPaginationMagazine() {
  const totalPages = Math.ceil(filteredDataMagazine.length / ITEMS_PER_PAGE_MAGAZINE);
  const container = document.getElementById("paginationMagazine");
  container.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn";
    btn.textContent = i;
    btn.onclick = () => {
      currentPageMagazine = i;
      renderPageMagazine(i);
      document.getElementById('magazine-table-section').scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top of section
    };
    container.appendChild(btn);
  }
}

// Initialize the SPA by showing the default page (Archive)
document.addEventListener('DOMContentLoaded', () => {
  showPage('archive-section');
  // Initialize bedroom filter visibility on page load for all sections
  toggleBedroomsFilter('archive');
  toggleBedroomsFilter('carousel');
  toggleBedroomsFilter('magazine');
});
