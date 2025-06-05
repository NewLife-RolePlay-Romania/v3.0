const { useQuasar } = Quasar
const { ref } = Vue

const app = Vue.createApp({
  setup () {
    return {
        options: ref(false),
        help: ref(false),
        showblur: ref(true),
    }
  },
  methods: {
    select: function(event) {
        targetId = event.currentTarget.id;
        showBlur()
    }
}
})

app.use(Quasar, { config: {} })
app.mount('#inventory-menus')

function showBlur() {
    $.post('https://qb-inventory/showBlur');
}

function updateTextInput(value) {
    document.getElementById('item-amount-text').value = value;
}

var InventoryOption = "0, 0, 0";

var totalWeight = 0;
var totalWeightOther = 0;

var playerMaxWeight = 0;
var otherMaxWeight = 0;

var otherLabel = "";

var ClickedItemData = {};

var SelectedAttachment = null;
var AttachmentScreenActive = false;
var ControlPressed = false;
var disableRightMouse = false;
var selectedItem = null;
var allWeapons = [];
var weaponsName = [];
var materialName = [];
var settingsName = [];
var foodsName = [];
var clothesName = [];

var IsDragging = false;

$(document).on("keydown", function() {
    if (event.repeat) {
        return;
    }
    switch (event.keyCode) {
        case 27: // ESC
            Inventory.Close();
            break;
        case 9: // TAB
            Inventory.Close();
            break;
        case 17: // TAB
            ControlPressed = true;
            break;
    }
});

const leftData = {
    "41": "bani_impachetati",
    "42": "driver_license",
    "43": "tablet",
    "44": "security",
    "45": "nl_backpack",
};

const rightData = {
    "46" : "radio",
    "47" : "phone",
    "48" : "billetera",
    "49" : "id_card",
    "50" : "driver_license",
};
const iconMap = {
    "bani_impachetati": "fa-sack-dollar",
    "driver_license": "fa-address-card",
    "tablet":      "fa-tablet-button",
    "security":       "fa-user-shield",
    "nl_backpack":     "fa-suitcase-rolling",
    "radio":          "fa-walkie-talkie",    // exemplu (ai nevoie de propack FA)
    "phone":          "fa-mobile-screen",   // fa-mobile / fa-mobile-alt / fa-mobile-screen
    "billetera":      "fa-wallet",
    "id_card":        "fa-id-card-clip",
    // ... etc.
  };

// Func?ie auxiliara pentru a gasi slotul special dupa numele itemului (ex: "phone" => 46)
function findSpecialSlot(itemName) {
    // 1) Cautam în leftData
    for (let slot in leftData) {
        if (leftData[slot] === itemName) {
            return parseInt(slot);
        }
    }
    // 2) Cautam în rightData
    for (let slot in rightData) {
        if (rightData[slot] === itemName) {
            return parseInt(slot);
        }
    }
    return null; // nu e în lista
}

// Func?ie care verifica daca slotul e liber (fara item)
function isSlotFree(slotNumber) {
    // În codul tau de baza, itemele jucatorului sunt randate în .player-inventory 
    // sau .player-inventory-backpack (dupa caz). Ajusteaza selectorul daca e alt container.
    let $slotEl = $(".player-inventory").find(`[data-slot='${slotNumber}']`);
    if (!$slotEl.length) return false; // nu exista slotul -> îl consideram nevalid
    let itemInSlot = $slotEl.data("item");
    // daca itemInSlot este undefined => e liber
    return (itemInSlot === undefined);
}

function getSpecialBoxesWeight() {
    let totalWeightSpecial = 0;
  
    // Selectam TOATE sloturile din "leftboxes" + "rightboxes"
    // care folosesc <div class="item-slot" data-slot="...">
    const $specialSlots = $(".player-body-leftboxes .item-slot, .player-body-rightboxes .item-slot");
  
    $specialSlots.each(function () {
      // each() => ne da acces la fiecare slot
      // 'this' e un <div class="item-slot" data-slot="NN">
      const itemData = $(this).data("item");  // { name, weight, amount, ... }
  
      if (itemData) {
        // Adaugam la total => weight * amount
        // (daca weight e în grame, îl împar?im la 1000 mai jos)
        totalWeightSpecial += (itemData.weight * itemData.amount);
      }
    });
  
    // Convertim la kg: împar?im la 1000 daca weight-ul e stocat în grame
    let totalWeightKg = totalWeightSpecial / 1000;
    if (totalWeightKg === 0) {
        return "0";
      }
  
    // Returnam cu 2 zecimale, ex. "1.23"
    return totalWeightKg.toFixed(2);
  }


$(document).on("dblclick", ".item-slot", function(e) {
    var ItemData = $(this).data("item");
    var ItemInventory = $(this).parent().attr("data-inventory");
    if (ItemData) {
        Inventory.Close();
        $.post(
            "https://qb-inventory/UseItem",
            JSON.stringify({
                inventory: ItemInventory,
                item: ItemData,
            })
        );
    }
});

$(document).on("keyup", function() {
    switch (event.keyCode) {
        case 17: // TAB
            ControlPressed = false;
            break;
    }
});

// cod nou
function updateRequirementIcons() {
    // Selectam toate sloturile ce au un "data-required"
    $(".item-slot[data-required]").each(function() {
      // Ob?inem item-ul din slot
      const itemData = $(this).data("item");
      if (itemData) {
        // Daca are item => adaugam clasa "slot-has-item"
        $(this).addClass("slot-has-item");
      } else {
        // Daca e gol => scoatem clasa
        $(this).removeClass("slot-has-item");
      }
    });
  }

$(document).on("mouseenter", ".item-slot", function (e) {
    e.preventDefault();
    if($("#qbcore-inventory").css("display") == "block"){
        if ($(this).data("item") != null) {
            if ($('.item-shit').css('display') == 'none') {
                $(".ply-iteminfo-container").css('display', 'block');
                FormatItemInfo($(this).data("item"));
            } else {
                $(".ply-iteminfo-container").css('display', 'none');
                $('.item-shit').css('display', 'none');
                $('.item-split').css('display', 'none');
                $('.item-info-description').css('display', 'block');

            }
            
        } else {
            if ($(this).data("item") != null && $('.item-shit').css('display') !== 'flex'){
                $(".ply-iteminfo-container").css('display', 'none');
                $('.item-shit').css('display', 'none');
                $('.item-split').css('display', 'none');
                $('.item-info-description').css('display', 'block');
            }
        }
    }
});

$(document).on("mouseleave", ".item-slot", function(e){
    e.preventDefault();
    if ($('.item-shit').css('display') == 'none') {
        $(".ply-iteminfo-container").fadeOut(0)
        $('.item-shit').css('display', 'none');
        $('.item-split').css('display', 'none');
        $('.item-info-description').css('display', 'block');
    }
});

// end cod nou

 //$(document).on('contextmenu', '.item-slot', function(e) {
 //    e.preventDefault();
 //    if ($(this).data("item") != null) {
 //        contextMenuSelectedItem = $(this).data("item");
 //      ItemInventory = $(this).parent().attr("data-inventory"); 
 //        $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
 //        $('#item-amount').attr('max', contextMenuSelectedItem.amount);
 //        $('#item-amount').val(contextMenuSelectedItem.amount);
 //        $('#item-amount-text').val(contextMenuSelectedItem.amount);
 //        $('.dropdown-content').addClass('show-dropdown');
 //     } else {
 //        $('#item-amount').val(0);
 //        $('#item-amount-text').val(0);
 //        $('.dropdown-content').removeClass('show-dropdown');
 //   }
 //});

$(document).on("mousedown", function (event) {
    switch (event.which) {
        case 1:
            if ($('.item-shit').css('display') !== 'none') {
                $(".ply-iteminfo-container").fadeOut(100);
                $('.item-shit').css('display', 'none');
                $('.item-split').css('display', 'none');
                $('.item-info-description').css('display', 'block');
            }
        break;
    }
});
$(document).on("mousedown", "#Use", function (event) {
    switch (event.which) {
        case 1:
            fromData = selected_item.data("item");
            fromInventory = selected_item.parent().attr("data-inventory");
            Inventory.Close();
            $.post(
                "https://qb-inventory/UseItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                })
            );
            $(".ply-iteminfo-container").fadeOut(100);
            $('.item-shit').css('display', 'none');
            $('.item-split').css('display', 'none');
            $('.item-info-description').css('display', 'block');
        break
    }
});
$(document).on("mousedown", "#Give", function (event) {
    switch (event.which) {
        case 1:
            fromData = selected_item.data("item");
            fromInventory = selected_item.parent().attr("data-inventory");
            Inventory.Close();
            amount = $("#item-amount").val() || fromData.amount
            $.post(
                "https://qb-inventory/GiveItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: parseInt(amount),
                })
            );
            $(".ply-iteminfo-container").fadeOut(100);
            $('.item-shit').css('display', 'none');
            $('.item-split').css('display', 'none');
            $('.item-info-description').css('display', 'none');
        break
    }
});
$(document).on("mousedown", "#Drop", function (event) {
    switch (event.which) {
        case 1:
            fromData = selected_item.data("item");
            fromInventory = selected_item.parent().attr("data-inventory");
            amount = $("#item-amount").val() || fromData.amount
            let fromSlot = selected_item.attr("data-slot")

            $.post(
                "https://qb-inventory/DropItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    slot: fromSlot,
                    amount: parseInt(amount),
                })
            );
            $(".ply-iteminfo-container").fadeOut(100);
            $('.item-shit').css('display', 'none');
            $('.item-split').css('display', 'none');
            $('.item-info-description').css('display', 'block');
        break
    }
});
$(document).on("mousedown", "#ItemSplit", function (event) {
       if (event.which === 1) {
        if ($('.item-shit').css('display') !== 'none') {
            // Hide the item info description
            $('.item-info-description').css('display', 'none');
            // Hide the main menu
            $('.item-shit').css('display', 'none');
            // Show the item-split UI
            $('.item-split').css('display', 'flex');
            
            $("#item-split-amount").html("1")
            $(".item-split-range").slider({
                range: "min",
                min: 1,
                max: selected_item_data.amount - 1,
                value: 1,
                slide: function (event, ui) {
                    $("#item-split-amount").html(ui.value)
                }
            })
        }
    }
});



$(document).on("mousedown", ".item-split-action", function (event) {
    switch (event.which) {
        case 1:
            if ($('.item-split').css('display') != 'none') {
                let amount = parseInt($("#item-split-amount").html());
                if (amount > 0) {
                    // We have the selected_item and selected_item_data from your existing code
                    // selected_item_data = The item data object
                    // selected_item = The DOM element with data-slot attribute
                    let fromData = selected_item_data;
                    let fromSlot = selected_item.attr("data-slot");
                    let inventory = "player";

                    // Call the server split event
                    $.post("https://qb-inventory/SplitItem", JSON.stringify({
                        inventory: inventory,
                        item: fromData,
                        slot: fromSlot,
                        amount: amount
                    }));

                    // Hide all menus after sending the request
                    $(".ply-iteminfo-container").fadeOut(100);
                    $('.item-shit').css('display', 'none');
                    $('.item-split').css('display', 'none');
                    $('.item-info-description').css('display', 'block');
                }
            }
        break;
    }
});



$(document).on("mousedown", ".item-split-cancel", function (event) {
    switch (event.which) {
        case 1:
            if ($('.item-split').css('display') != 'none') {
                $('.item-split').css('display', 'none');
                $('.item-info-description').css('display', 'block');
                $('.item-shit').css('display', 'flex');
            }
        break
    }
});


$(document).on("mousedown", "#ViewAttachments", function (event) {
    event.preventDefault();
    if (!Inventory.IsWeaponBlocked(ClickedItemData.name)) {
        $(".weapon-attachments-container").css({ display: "block" });
        $("#qbcore-inventory").animate({
                left: 100 + "vw",
            },
            200,
            function() {
                $("#qbcore-inventory").css({ display: "none" });
            }
        );
        $(".weapon-attachments-container").animate({
                left: 0 + "vw",
            },
            200
        );
        AttachmentScreenActive = true;
            FormatAttachmentInfo(ClickedItemData);
    } else {
        $.post(
            "https://qb-inventory/Notify",
            JSON.stringify({
                message: "Attachments are unavailable for this gun.",
                type: "error",
            })
        );
    }
});

$(document).on("mousedown", "#QuickEquip", function(e) {
    if (e.which === 1 && selected_item && selected_item_data) {
        let oldSlot   = selected_item.attr("data-slot");              // slotul sursa
        let itemName  = selected_item_data.name.toLowerCase();        // ex. "phone"
        let newSlot   = findSpecialSlot(itemName);                    // ex. 46

        if (!newSlot) {
            //console.log("Itemul nu are slot special!");
            return;
        }

        // Trimi?i serverului comanda de "mutare" a 1 item
        $.post("https://qb-inventory/SetInventoryData", JSON.stringify({
            fromInventory: "player", 
            toInventory:   "player",
            fromSlot:      parseInt(oldSlot),
            toSlot:        parseInt(newSlot),
            fromAmount:    1
            // toAmount îl la?i nedefinit sau zero
        }));
        
        // Dupa ce ai dat comanda, po?i ascunde direct butonul:
        // $("#QuickEquip").css("display", "none");
    }
});

$(document).on("mousedown", "#Dezechipeaza", function(e) {
    if (e.which === 1 && selected_item && selected_item_data) {
        let oldSlot  = selected_item.attr("data-slot");  // ex. "46"
        let fromData = selected_item_data;               // ex. { name: "phone", amount: 1, ... }

        // 1) Gasim un container jQuery pentru inventar:
        let $playerInv = $(".player-inventory");   // ? containerul principal

        // 2) Apelam GetFirstFreeSlot($toInv, $fromSlot)
        //    Nota: al doilea parametru (ex. 'null') e ignorat de multe ori
        //    daca func?ia nu folose?te $fromSlot. Dar îl po?i trimite totu?i.
        let newSlot = GetFirstFreeSlot($playerInv, null);
        if (!newSlot) {
            //console.log("Nu exista slot liber pentru dezechipare!");
            return;
        }

        // 3) Presupunem ca vrem sa mute TOT itemul (daca are amount=2, mutam 2).
        //    Dar po?i schimba `fromData.amount` cu 1, daca vrei doar 1 bucata.
        $.post("https://qb-inventory/SetInventoryData", JSON.stringify({
            fromInventory: "player",
            toInventory:   "player",
            fromSlot:      parseInt(oldSlot),
            toSlot:        parseInt(newSlot),
            fromAmount:    fromData.amount
        }));

        // 4) Ascundem butonul
        $('#Dezechipeaza').css('display', 'none');
    }
});



// Autostack Quickmove
function GetFirstFreeSlot($toInv, $fromSlot) {
    var retval = null;
    $.each($toInv.find(".item-slot"), function(i, slot) {
        if ($(slot).data("item") === undefined) {
            if (retval === null) {
                retval = i + 1;
            }
        }
    });
    return retval;
}

function CanQuickMove() {
    var otherinventory = otherLabel.toLowerCase();
    var retval = true;
    // if (otherinventory == "grond") {
    //     retval = false
    // } else if (otherinventory.split("-")[0] == "dropped") {
    //     retval = false;
    // }
    if (otherinventory.split("-")[0] == "player") {
        retval = false;
    }
    return retval;
}

$(document).on("click", "#inv-close", function(e) {
    e.preventDefault();
    Inventory.Close();
});

$(document).on("click", ".weapon-attachments-back", function(e) {
    e.preventDefault();
    $("#qbcore-inventory").css({ display: "block" });
    $("#qbcore-inventory").animate({
            left: 0 + "vw",
        },
        200
    );
    $(".weapon-attachments-container").animate({
            left: -100 + "vw",
        },
        200,
        function() {
            $(".weapon-attachments-container").css({ display: "none" });
        }
    );
    AttachmentScreenActive = false;
});

 function changeInventoryColor(color) {
     $( ".player-inventory-bg" ).css( "background-color", color);
     $( ".other-inventory-bg" ).css( "background-color", color);
     $( ".inv-options" ).css( "background-color", color);
     localStorage.setItem('qb-inventory-color', color);
 }

 const savedColor = localStorage.getItem('qb-inventory-color');

 if (savedColor) {
     changeInventoryColor(savedColor)
 }

 $('#favcolor').change(function(){
     let color = $(this).val();
     let hexOpacity = "CC";
     let finalColor = color+hexOpacity;
     changeInventoryColor(finalColor);
 });

 function FormatAttachmentInfo(ClickedItemData) {
     $.post(
        "https://qb-inventory/GetWeaponData",
        JSON.stringify({
            weapon: ClickedItemData.name,
            ItemData: ClickedItemData,
        }),
        function(data) { // Renamed this parameter to 'data' instead of 'ClickedItemData'
            var AmmoLabel = "9mm";
            var Durability = 100;

            // Check ammo type from data.WeaponData
            if (data.WeaponData.ammotype == "AMMO_RIFLE") {
                AmmoLabel = "7.62";
            } else if (data.WeaponData.ammotype == "AMMO_SHOTGUN") {
                AmmoLabel = "12 Gauge";
            }

            // Check for quality from data.info
            if (data.info && data.info.quality !== undefined) {
                Durability = data.info.quality;
            }

            $(".weapon-attachments-container-title").html(
                data.WeaponData.label + " | " + AmmoLabel
            );
            $(".weapon-attachments-container-description").html(
                data.WeaponData.description
            );
            $(".weapon-attachments-container-details").html(
                '<span style="font-weight: bold; letter-spacing: .1vh;">Serial</span><br> ' +
                (data.info.serie || "N/A") +
                '<br><br><span style="font-weight: bold; letter-spacing: .1vh;">Durability - ' +
                Durability.toFixed() +
                '% </span> <div class="weapon-attachments-container-detail-durability"><div class="weapon-attachments-container-detail-durability-total"></div></div>'
            );
            $(".weapon-attachments-container-detail-durability-total").css({
                width: Durability + "%",
            });
            $(".weapon-attachments-container-image").attr(
                "src",
                "./attachment_images/" + data.WeaponData.name + ".png"
            );
            $(".weapon-attachments").html("");

            if (data.AttachmentData !== null && data.AttachmentData !== undefined) {
                if (data.AttachmentData.length > 0) {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: bold; letter-spacing: .1vh;">Attachments</span>'
                    );
                    $.each(data.AttachmentData, function(i, attachment) {
                        $(".weapon-attachments").append(
                            '<div class="weapon-attachment" id="weapon-attachment-' +
                            i +
                            '"> <div class="weapon-attachment-label"><p>' +
                            attachment.label +
                            '</p></div> <div class="weapon-attachment-img"><img src="./images/' +
                            attachment.image + '"></div> </div>'
                        );
                        attachment.id = i;
                        $("#weapon-attachment-" + i).data("AttachmentData", attachment);
                    });
                } else {
                    $(".weapon-attachments-title").html(
                        '<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                    );
                }
            } else {
                $(".weapon-attachments-title").html(
                    '<span style="font-weight: bold; letter-spacing: .1vh;">This gun doesn\'t contain attachments</span>'
                );
            }

            handleAttachmentDrag();
        }
    );
}



var AttachmentDraggingData = {};

function handleAttachmentDrag() {
    $(".weapon-attachment").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        start: function(event, ui) {
            var ItemData = $(this).data("AttachmentData");
                 AttachmentDraggingData = ItemData;
        },
        stop: function() {
            
        },
    });

    $(".weapon-attachments-remove").droppable({
        accept: ".weapon-attachment",
        hoverClass: "weapon-attachments-remove-hover",
        drop: function(event, ui) {
            $.post("https://qb-inventory/RemoveAttachment", JSON.stringify({
                AttachmentData: AttachmentDraggingData,
                WeaponData: ClickedItemData,
            }));
        },
    });
}

window.addEventListener("message", function(event) {
    let data = event.data;

    if (data.action === "RemoveAttachmentResult") {
        if (!data.Attachments) data.Attachments = [];
        ClickedItemData.info.attachments = data.Attachments;
        FormatAttachmentInfo(ClickedItemData);
    }
});

$(document).on("click", "#weapon-attachments", function(e) {
    e.preventDefault();
    if (!Inventory.IsWeaponBlocked(ClickedItemData.name)) {
        $(".weapon-attachments-container").css({ display: "block" });
        $("#qbcore-inventory").animate({
                left: 100 + "vw",
            },
            200,
            function() {
                $("#qbcore-inventory").css({ display: "none" });
            }
        );
        $(".weapon-attachments-container").animate({
                left: 0 + "vw",
            },
            200
        );
        AttachmentScreenActive = true;
        FormatAttachmentInfo(ClickedItemData);
    } else {
        $.post(
            "https://qb-inventory/Notify",
            JSON.stringify({
                message: "Attachments are unavailable for this gun.",
                type: "error",
            })
        );
    }
});

function getGender(info) {
    return info.gender === 1 ? "Woman" : "Man";
}

function setItemInfo(title, description) {
    $(".item-info-title").html(`<p>${title}</p>`);
    $(".item-info-description").html(description);
}

function generateDescription(itemData) {
    if (itemData.type === "weapon") {
        let ammo = itemData.info.ammo ?? 0;
        return `<p><strong>Name : </strong><span>${itemData.info.serie}</span></p>
                    <p><strong>Ammunition: </strong><span>${ammo}</span></p>
                    <p>${itemData.description}</p>`;
    }

    if (itemData.name == "phone" && itemData.info.lbPhoneNumber) {
        return `<p><strong>Phone Number: </strong><span>${itemData.info.lbFormattedNumber ?? itemData.info.lbPhoneNumber}</span></p>`;
    }

    switch (itemData.name) {
        case "id_card":
            return `<p><strong>CNP: </strong><span>${itemData.info.citizenid}</span></p>
              <p><strong>Nume: </strong><span>${itemData.info.firstname}</span></p>
              <p><strong>Prenume: </strong><span>${itemData.info.lastname}</span></p>
              <p><strong>Data nasterii: </strong><span>${itemData.info.birthdate}</span></p>
              <p><strong>Sex: </strong><span>${getGender(itemData.info)}</span></p>
              <p><strong>Nationalitate: </strong><span>${itemData.info.nationality}</span></p>`;
        case "driver_license":
            return `<p><strong>Nume: </strong><span>${itemData.info.firstname}</span></p>
            <p><strong>Prenume: </strong><span>${itemData.info.lastname}</span></p>
            <p><strong>Data nasterii: </strong><span>${itemData.info.birthdate}</span>
            </p><p><strong>Categorii: </strong><span>${itemData.info.type}</span></p>`;
        case "weaponlicense":
            return `<p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>`;
        case "lawyerpass":
            return `<p><strong>Pass-ID: </strong><span>${itemData.info.id}</span></p>
            <p><strong>First Name: </strong><span>${itemData.info.firstname}</span></p>
            <p><strong>Last Name: </strong><span>${itemData.info.lastname}</span></p>
            <p><strong>CSN: </strong><span>${itemData.info.citizenid}</span></p>`;
        case "syphoningkit":
            return `<p><strong>A kit used to syphon gasoline from vehicles! </strong><span>${itemData.info.gasamount} Liters Inside.</span></p>`
        case "jerrycan":
            return `<p><strong>In aceasta canistra mai sunt </strong><span>${itemData.info.gasamount} litrii de carburant.</span></p>`
        case "wateringcan":
            return `<p><strong>A Watering Can, designed to hold Water ! </strong><span>${itemData.info.durability} Liters Inside.</span></p>` 
        case "ciggypack":
            return `<p><strong>Cigarettes : </strong><span>${itemData.info.uses} Liters Inside.</span></p>`
        case "lockpick":
            return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses}</span></p>
            <p><strong>Type: </strong><span>${itemData.info.tier}</span></p>`
        case "breaker":
        return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses}</span></p>
        <p><strong>Type: </strong><span>${itemData.info.tier}</span></p>`
        case "drill":
            return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses || 2}</span></p>`
        case "hack_device":
            return `<p><strong>Remaining uses : </strong><span>${itemData.info.uses || 2}</span></p>`
        case "filled_evidence_bag":
            if (itemData.info.type == "casing") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Type number: </strong><span>${itemData.info.ammotype}</span></p>
                <p><strong>Caliber: </strong><span>${itemData.info.ammolabel}</span></p>
                <p><strong>Name: </strong><span>${itemData.info.serie}</span></p>
                <p><strong>Crime scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            } else if (itemData.info.type == "blood") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Blood type: </strong><span>${itemData.info.bloodtype}</span></p>
                <p><strong>DNA Code: </strong><span>${itemData.info.dnalabel}</span></p>
                <p><strong>Crime scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            }
            
            else if (itemData.name == "key1") {
            $(".item-info-title").html("<p>" + itemData.label + "</p>");
            $(".item-info-description").html("<p>Nr.Camera: #" + itemData.info.roomnumber + "</p>");
             }
            else if (itemData.name == "billetera") {
                $(".item-info-title").html('<p>'+itemData.label+'</p>')
                $(".item-info-description").html('<p>Portofel' + itemData.info.billeteraid + '</p>');
            }
            else if (itemData.info.type == "fingerprint") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>Fingerprint: </strong><span>${itemData.info.fingerprint}</span></p>
                <p><strong>Crime Scene: </strong><span>${itemData.info.street}</span></p><br /><p>${itemData.description}</p>`;
            }    
             else if (itemData.info.type == "dna") {
                return `<p><strong>Evidence material: </strong><span>${itemData.info.label}</span></p>
                <p><strong>DNA Code: </strong><span>${itemData.info.dnalabel}</span></p><br /><p>${itemData.description}</p>`;
            }
        case "stickynote":
            return `<p>${itemData.info.label}</p>`;
        case "moneybag":
            return `<p><strong>Amount of cash: </strong><span>$${itemData.info.cash}</span></p>`;
        case "markedbills":
            return `<p><strong>Worth: </strong><span>$${itemData.info.worth}</span></p>`;
        case "visa":
            return `<p><strong>Card Holder: </strong><span>${itemData.info.name}</span></p>`;
        case "mastercard":
            return `<p><strong>Card Holder: </strong><span>${itemData.info.name}</span></p>`;
        case "labkey":
            return `<p>Lab: ${itemData.info.lab}</p>`;
        default:
            return itemData.description;
    }
}

function FormatItemInfo(itemData, mouse) {
    if (itemData && itemData.info !== "") {
        const description = generateDescription(itemData);
        $('.item-uselessinfo-weight').html(`<i class="fa-solid fa-weight-hanging"></i> ${((itemData.weight * itemData.amount / 1000))}KG`)
        $('.item-uselessinfo-decay').html(`<i class="fa-solid fa-bolt"></i> ${(Math.floor(itemData.info?.quality || 0))}%`)
        setItemInfo(itemData.label, description, mouse);
    } else {
        setItemInfo(itemData.label, itemData.description || "", mouse);
    }
}

$(document).on("click", ".item-slot", function (event) {
    switch (event.which) {
        case 1:
            fromInventory = $(this).parent();
            if ($(fromInventory).attr("data-inventory") == "player") {
                if ($('.item-shit').css('display') == 'none') {
                    $('.item-shit').css('display', 'flex');
                    $('.item-info-description').css('display', 'none');
                    $('.item-split').css('display', 'none');


                    selected_item = $(this)
                    selected_item_data = $(this).data("item")

                    // Add this check:
                     if (selected_item_data && selected_item_data.amount > 1) {
                    // If amount > 1, show the "Imparte" button
                         $('#ItemSplit').css('display', 'flex');
                      } else {
                    // If amount <= 1, hide the "Imparte" button
                      $('#ItemSplit').css('display', 'none');
                    }
                    
                    if (selected_item_data.type === "weapon" && !Inventory.IsWeaponBlocked(selected_item_data.name)) {
                        $("#ViewAttachments").css("display", "flex");
                            // Set ClickedItemData here
                        ClickedItemData = selected_item_data;
                    } else {
                        $("#ViewAttachments").css("display", "none");
                    }

                        // Butonul de dezechipare
                        // 1) Ob?inem numarul slotului (ex. "45") ?i-l convertim la numar
                        let slotNum = parseInt($(this).attr("data-slot"), 10) || 0;

                        // 2) Ascundem oricum butonul, ca sa fie vizibil doar în condi?iile dorite
                        $("#Dezechipeaza").css("display", "none");

                        // 3) Verificam daca slotul e în intervalul 41..50
                        if (slotNum >= 41 && slotNum <= 50) {
                            // 4) Verificam daca exista un item în slot
                            let itemData = $(this).data("item");
                            if (itemData) {
                                // Avem item => afisam butonul
                                $("#Dezechipeaza").css("display", "flex");

                            }
                        }

                    let targetSlot = findSpecialSlot(selected_item_data.name.toLowerCase());
                    if (!targetSlot) {
                        // nu se afla în leftData/rightData => nu afi?am buton QuickEquip
                        $("#QuickEquip").css("display", "none");
                        return;
                    }
               
                    // Avem un slot special => verificam daca e liber
                    if (isSlotFree(targetSlot)) {
                        // E liber => îi dam voie jucatorului sa faca QuickEquip
                        $("#QuickEquip").css("display", "flex");
                    } else {
                        // Slot ocupat => ascundem butonul QuickEquip
                        $("#QuickEquip").css("display", "none");
                    }

                    topy = event.clientY
                    lefty = event.clientX
                } else {
                    $('.item-shit').css('display', 'none');
                    $('.item-split').css('display', 'none');
                    $('.item-info-description').css('display', 'block');
                    if ($(this).data('item') != undefined) {
                        FormatItemInfo($(this).data("item"));
                    }
                }
            }
        break 
        case 3:
            if (event.shiftKey) {
                fromSlot = $(this).attr("data-slot");
                fromInventory = $(this).parent();
                if ($(fromInventory).attr("data-inventory") == "player") {
                    toInventory = $(".other-inventory");
                } else {
                    toInventory = $(".player-inventory");
                }
                toSlot = GetFirstFreeSlot(toInventory, $(this));
                if ($(this).data("item") === undefined) {
                    return;
                }
                toAmount = $("#item-amount").val() || $(this).data("item").amount;
                
                if (CanQuickMove()) {
                    if (toSlot === null) {
                        InventoryError(fromInventory, fromSlot);
                        return;
                    }
                    if (fromSlot == toSlot && fromInventory == toInventory) {
                        return;
                    }
                    if (toAmount >= 0) {
                        if (updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)) {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    }
                } else {
                    InventoryError(fromInventory, fromSlot);
                }
                break;
            } else {
                if ($('.item-shit').css('display') == 'none') {
                    $('.item-shit').css('display', 'flex');
                    $('.item-info-description').css('display', 'block');
                    selected_item = $(this)
                    selected_item_data = $(this).data("item")
                } else {
                    $('.item-shit').css('display', 'none');
                    $('.item-info-description').css('display', 'block');
                    if ($(this).data('item') != undefined) {
                        FormatItemInfo($(this).data("item"));
                    }
                }
            }
        }
    }
);

let lefty = 0
let topy = 0
$('body').mousemove(function (event) { 
        if ($('.item-shit').css('display') !== 'none' || $('.item-split').css('display') !== 'none') {
        return;
    }
    topy = event.clientY
    lefty = event.clientX
    var howloooong = $('.ply-iteminfo-container').width();
    var howtaaaall = $('.ply-iteminfo-container').height()/2 > 70 ? $('.ply-iteminfo-container').height()/2 - 100 : $('.ply-iteminfo-container').height()/2 
    if (event.clientX < 1560) {
        datway = false
        $('.ply-iteminfo-container').css('left', (event.clientX+26)+'px').css('top', (event.clientY-howtaaaall)+'px')
    } else if (event.clientX >= 1560) {
        datway = true
        var howloooong = $('.ply-iteminfo-container').width();
        $('.ply-iteminfo-container').css('left', (event.clientX-howloooong-26)+'px').css('top', (event.clientY-howtaaaall)+'px')
    }
});

function handleDragDrop() {
    $(".item-drag").draggable({
        helper: "clone",
        appendTo: "body",
        scroll: true,
        revertDuration: 0,
        revert: "invalid",
        cancel: ".item-nodrag",
        start: function(event, ui) {
            IsDragging = true;
            // $(this).css("background", "rgba(20,20,20,1.0)");
            $(this).find("img").css("filter", "brightness(50%)");

            $(".ply-iteminfo-container").fadeOut(100);
            $('.item-shit').css('display', 'none');
            $('.item-info-description').css('display', 'block');

            //  $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");

            var itemData = $(this).data("item");
            var dragAmount = $("#item-amount").val();
            if (!itemData.useable) {
                // $("#item-use").css("background", "rgba(35,35,35, 0.5");
            }

            if (dragAmount == 0) {
                if (itemData.price != null) {
                    $(this).find(".item-slot-amount p").html("0");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this).find(".item-slot-amount p").html("0");
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount +
                            " " +
                            
                            " "
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else if (dragAmount > itemData.amount) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount +
                            " " +
                            
                            " "
                        );
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            } else if (dragAmount > 0) {
                if (itemData.price != null) {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(" " + itemData.amount + " £" + itemData.price);
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                } else {
                    $(this)
                        .find(".item-slot-amount p")
                        .html(
                            itemData.amount -
                            dragAmount +
                            " " +
                            (
                                (itemData.weight * (itemData.amount - dragAmount)) /
                                1000
                            ).toFixed(1) +
                            " "
                        );
                    $(".ui-draggable-dragging")
                        .find(".item-slot-amount p")
                        .html(
                            dragAmount +
                            " " +
                            
                            " "
                        );
                    $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    if ($(this).parent().attr("data-inventory") == "hotbar") {
                        // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                    }
                }
            } else {
                if ($(this).parent().attr("data-inventory") == "hotbar") {
                    // $(".ui-draggable-dragging").find(".item-slot-key").remove();
                }
                $(".ui-draggable-dragging").find(".item-slot-key").remove();
                $(this)
                    .find(".item-slot-amount p")
                    .html(
                        itemData.amount +
                        " " +
                        
                        " "
                    );
                InventoryError($(this).parent(), $(this).attr("data-slot"));
            }
        },
        stop: function() {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            $(this).css("background", "rgba(23, 27, 43, 0.5)");
            $(this).find("img").css("filter", "brightness(100%)");
            // $("#item-use").css("background", "rgba(" + InventoryOption + ", 0.3)");
        },
    });

    $(".item-slot").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromSlot = ui.draggable.attr("data-slot");
            fromInventory = ui.draggable.parent();
            toSlot = $(this).attr("data-slot");
            toInventory = $(this).parent();
            toAmount = $("#item-amount").val();

            // 1) Cite?te atributele de tip "required" de pe slotul-?inta (daca exista)
                var requiredItem = $(this).attr("data-required");  
                //console.log("Verificam ce ne cere: =>", requiredItem);
                var fromData = ui.draggable.data("item");
                //console.log("Verificam ce avem: =>", fromData.name.toLowerCase());
                if (requiredItem) {
                // 2) Recupereaza itemul pe care-l mutam
                if (fromData) {
                    // Verifica daca fromData.name e fix requiredItem
                    // (toLowerCase pentru siguran?a)
                    if (fromData.name.toLowerCase() !== requiredItem.toLowerCase()) {
                        $(this).addClass("invalid-drop");

                        // 2) Dupa ~1 secunda, o scoatem
                        setTimeout(() => {
                          $(this).removeClass("invalid-drop");
                        }, 10000);

                    // Ratare => apelam InventoryError ?i ie?im
                    InventoryError(ui.draggable.parent(), fromSlot);
                    return; 
                        }
                    }
                }



            var toDataUnique = toInventory.find("[data-slot=" + toSlot + "]").data("item");
            var fromDataUnique = fromInventory.find("[data-slot=" + fromSlot + "]").data("item");

            if (fromSlot == toSlot && fromInventory == toInventory) {
                return;
            }
            if (toAmount >= 0) {
                if (!toDataUnique) {
                if (
                    updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                ) {
                    swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                }
                } else {
                    if (fromDataUnique.unique == toDataUnique.unique) {
                        if (!toDataUnique.combinable) {
                            if (
                                updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                            ) {
                                swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                            }
                        } else {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    } else {
                        if (
                            updateweights(fromSlot, toSlot, fromInventory, toInventory, toAmount)
                        ) {
                            swap(fromSlot, toSlot, fromInventory, toInventory, toAmount);
                        }
                    }
                }
            }
        },
    });

    $("#item-use").droppable({
        hoverClass: "button-hover",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            if (fromData.useable) {
                if (fromData.shouldClose) {
                    Inventory.Close();
                }
                $.post(
                    "https://qb-inventory/UseItem",
                    JSON.stringify({
                        inventory: fromInventory,
                        item: fromData,
                    })
                );
            }
        },
    });

    $("#item-drop").droppable({
        hoverClass: "item-slot-hoverClass",
        drop: function(event, ui) {
            setTimeout(function() {
                IsDragging = false;
            }, 300);
            fromData = ui.draggable.data("item");
            fromInventory = ui.draggable.parent().attr("data-inventory");
            amount = $("#item-amount").val();
            if (amount == 0) {
                amount = fromData.amount;
            }
            $(this).css("background", "rgba(23, 27, 43, 0.7");
            $.post(
                "https://qb-inventory/DropItem",
                JSON.stringify({
                    inventory: fromInventory,
                    item: fromData,
                    amount: parseInt(amount),
                })
            );
        },
    });
}

function updateweights($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    var otherinventory = otherLabel.toLowerCase();
    if (otherinventory.split("-")[0] == "dropped") {
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return false;
        }
    }
    if (
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "hotbar") ||
        ($fromInv.attr("data-inventory") == "player" &&
            $toInv.attr("data-inventory") == "player") ||
        ($fromInv.attr("data-inventory") == "hotbar" &&
            $toInv.attr("data-inventory") == "hotbar")
    ) {
        return true;
    }
    if (
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop") ||
        ($fromInv.attr("data-inventory") == "crafting" &&
            $toInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " £" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toAmount == 0 &&
        ($fromInv.attr("data-inventory").split("-")[0] == "itemshop" ||
            $fromInv.attr("data-inventory") == "crafting")
    ) {
        itemData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " £" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $fromInv
                .find("[data-slot=" + $fromSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if (
        $toInv.attr("data-inventory").split("-")[0] == "itemshop" ||
        $toInv.attr("data-inventory") == "crafting"
    ) {
        itemData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toInv.attr("data-inventory").split("-")[0] == "itemshop") {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " £" +
                    itemData.price +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        } else {
            $toInv
                .find("[data-slot=" + $toSlot + "]")
                .html(
                    '<div class="item-slot-img"><img src="images/' +
                    itemData.image +
                    '" alt="' +
                    itemData.name +
                    '" /></div><div class="item-slot-amount"><p>' +
                    itemData.amount +
                    '</div><div class="item-slot-name1"><p>' +
                    " " +
                    ((itemData.weight * itemData.amount) / 1000).toFixed(1) +
                    '</p></div><div class="item-slot-label"><p>' +
                    itemData.label +
                    "</p></div>"
                );
        }

        InventoryError($fromInv, $fromSlot);
        return false;
    }

    if ($fromInv.attr("data-inventory") != $toInv.attr("data-inventory")) {
        fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
        toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
        if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (toData == null || fromData.name == toData.name) {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
            }
        } else {
            if (
                $fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar"
            ) {
                totalWeight = totalWeight - fromData.weight * $toAmount;
                totalWeight = totalWeight + toData.weight * toData.amount;

                totalWeightOther = totalWeightOther + fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther - toData.weight * toData.amount;
            } else {
                totalWeight = totalWeight + fromData.weight * $toAmount;
                totalWeight = totalWeight - toData.weight * toData.amount;

                totalWeightOther = totalWeightOther - fromData.weight * $toAmount;
                totalWeightOther = totalWeightOther + toData.weight * toData.amount;
            }
        }
    }

    if (
        totalWeight > playerMaxWeight ||
        (totalWeightOther > otherMaxWeight &&
            $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
            $fromInv.attr("data-inventory") != "crafting")
    ) {
        InventoryError($fromInv, $fromSlot);
        return false;
    }

    var per =(totalWeight/1000)/(playerMaxWeight/100000)
    $(".pro").css("width",per+"%")
    $("#player-inv-weight").html(
        // '<i class="fas fa-dumbbell"></i> ' +
        (parseInt(totalWeight) / 1000) +
        "kg /" +
        (playerMaxWeight / 1000) + "kg"
    );
    if (
        $fromInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $toInv.attr("data-inventory").split("-")[0] != "itemshop" &&
        $fromInv.attr("data-inventory") != "crafting" &&
        $toInv.attr("data-inventory") != "crafting"
    ) {
        $("#other-inv-label").html(otherLabel);
        $("#other-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (parseInt(totalWeightOther) / 1000) +
            "kg /" +
            (otherMaxWeight / 1000) + "kg" // celalalt inventar
        );
        var per1 =(totalWeightOther/1000)/(otherMaxWeight/100000)
        $(".pro1").css("width",per1+"%");
    }

    return true;
}

var combineslotData = null;

$(document).on("click", ".CombineItem", function(e) {
    e.preventDefault();
    if (combineslotData.toData.combinable.anim != null) {
        $.post(
            "https://qb-inventory/combineWithAnim",
            JSON.stringify({
                combineData: combineslotData.toData.combinable,
                usedItem: combineslotData.toData.name,
                requiredItem: combineslotData.fromData.name,
            })
        );
    } else {
        $.post(
            "https://qb-inventory/combineItem",
            JSON.stringify({
                reward: combineslotData.toData.combinable.reward,
                toItem: combineslotData.toData.name,
                fromItem: combineslotData.fromData.name,
            })
        );
    }
    Inventory.Close();
});

$(document).on("click", ".SwitchItem", function(e) {
    e.preventDefault();
    $(".combine-option-container").hide();

    optionSwitch(
        combineslotData.fromSlot,
        combineslotData.toSlot,
        combineslotData.fromInv,
        combineslotData.toInv,
        combineslotData.toAmount,
        combineslotData.toData,
        combineslotData.fromData
    );
});

function optionSwitch(
    $fromSlot,
    $toSlot,
    $fromInv,
    $toInv,
    $toAmount,
    toData,
    fromData
) {
    fromData.slot = parseInt($toSlot);

    $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

    $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
    $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

    if ($toSlot < 6) {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $toSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    } else {
        $toInv
            .find("[data-slot=" + $toSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                fromData.image +
                '" alt="' +
                fromData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                fromData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                fromData.label +
                "</p></div>"
            );
    }

    toData.slot = parseInt($fromSlot);

    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
    $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-nodrag");

    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

    if ($fromSlot < 6) {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-key"><p>' +
                $fromSlot +
                '</p></div><div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    } else {
        $fromInv
            .find("[data-slot=" + $fromSlot + "]")
            .html(
                '<div class="item-slot-img"><img src="images/' +
                toData.image +
                '" alt="' +
                toData.name +
                '" /></div><div class="item-slot-amount"><p>' +
                toData.amount +
                '</div><div class="item-slot-name"><p>' +
                " " +
                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                '</p></div><div class="item-slot-label"><p>' +
                toData.label +
                "</p></div>"
            );
    }

    $.post(
        "https://qb-inventory/SetInventoryData",
        JSON.stringify({
            fromInventory: $fromInv.attr("data-inventory"),
            toInventory: $toInv.attr("data-inventory"),
            fromSlot: $fromSlot,
            toSlot: $toSlot,
            fromAmount: $toAmount,
            toAmount: toData.amount,
        })
    );
}

function swap($fromSlot, $toSlot, $fromInv, $toInv, $toAmount) {
    fromData = $fromInv.find("[data-slot=" + $fromSlot + "]").data("item");
    toData = $toInv.find("[data-slot=" + $toSlot + "]").data("item");
    var otherinventory = otherLabel.toLowerCase();

    if (otherinventory.split("-")[0] == "dropped") {
        if (toData !== null && toData !== undefined) {
            InventoryError($fromInv, $fromSlot);
            return;
        }
    }

    if (fromData !== undefined && fromData.amount >= $toAmount) {
        if (fromData.unique && $toAmount > 1) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            ($fromInv.attr("data-inventory") == "player" ||
                $fromInv.attr("data-inventory") == "hotbar") &&
            $toInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $toInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        }

        if (
            $toAmount == 0 &&
            $fromInv.attr("data-inventory").split("-")[0] == "itemshop" &&
            $fromInv.attr("data-inventory") == "crafting"
        ) {
            InventoryError($fromInv, $fromSlot);
            return;
        } else if ($toAmount == 0) {
            $toAmount = fromData.amount;
        }
        if (
            (toData != undefined || toData != null) &&
            toData.name == fromData.name &&
            !fromData.unique
        ) {
            var newData = [];
            newData.name = toData.name;
            newData.label = toData.label;
            newData.amount = parseInt($toAmount) + parseInt(toData.amount);
            newData.type = toData.type;
            newData.description = toData.description;
            newData.image = toData.image;
            newData.weight = toData.weight;
            newData.info = toData.info;
            newData.useable = toData.useable;
            newData.unique = toData.unique;
            newData.slot = parseInt($toSlot);

            if (newData.name == fromData.name) {
                if (newData.info.quality !== fromData.info.quality  ) {
                    InventoryError($fromInv, $fromSlot);
                    $.post(
                        "https://qb-inventory/Notify",
                        JSON.stringify({
                            message: "You can not stack items which are not the same quality.",
                            type: "error",
                        })
                    );
                    return;

                }
            }

            if (fromData.amount == $toAmount) {
                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newData.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                    if (newData.info.quality == undefined) {
                        newData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (newData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                        QualityColor = "rgb(127,82,0)";
                    } else if (newData.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (newData.info.quality !== undefined) {
                        qualityLabel = newData.info.quality.toFixed();
                    } else {
                        qualityLabel = newData.info.quality;
                    }
                    if (newData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeClass("item-drag");
                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-nodrag");

                $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .html(
                        '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                    );
            } else if (fromData.amount > $toAmount) {
                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newData.label + "</p></div>";
                // if (newData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newData.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>6 <i class="fas fa-lock"></i></p></div><div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newData.image +
                            '" alt="' +
                            newData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newData.weight * newData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newData.name)) {
                    if (newData.info.quality == undefined) {
                        newData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (newData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (newData.info.quality > 25 && newData.info.quality < 50) {
                        QualityColor = "rgb(230, 126, 34)";
                    } else if (newData.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (newData.info.quality !== undefined) {
                        qualityLabel = newData.info.quality.toFixed();
                    } else {
                        qualityLabel = newData.info.quality;
                    }
                    if (newData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                // From Data zooi
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataFrom.amount +
                            '</div><div class="item-slot-name1"><p>' +
                            " £" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                newDataFrom.label +
                                "</p></div>";
                        // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    //     if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                        if (newDataFrom.info.quality == undefined) {
                            newDataFrom.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(127,82,0)";
                        if (newDataFrom.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (newDataFrom.info.quality > 25 && newDataFrom.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newDataFrom.info.quality >= 50) {
                            QualityColor = "rgb(127,82,0)";
                        }
                        if (newDataFrom.info.quality !== undefined) {
                            qualityLabel = newDataFrom.info.quality.toFixed();
                        } else {
                            qualityLabel = newDataFrom.info.quality;
                        }
                        if (newDataFrom.info.quality == 0) {
                            qualityLabel = "BROKEN";
                        }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        // }
                    // }
                        }
                    }
            $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            $.post(
                "https://qb-inventory/SetInventoryData",
                JSON.stringify({
                    fromInventory: $fromInv.attr("data-inventory"),
                    toInventory: $toInv.attr("data-inventory"),
                    fromSlot: $fromSlot,
                    toSlot: $toSlot,
                    fromAmount: $toAmount,
                })
            );
        } else {
            if (fromData.amount == $toAmount) {
                if (toData && toData.unique){
                    InventoryError($fromInv, $fromSlot);
                    return;
                }
                if (
                    toData != undefined &&
                    toData.combinable != null &&
                    isItemAllowed(fromData.name, toData.combinable.accept)
                ) {
                    $.post(
                        "https://qb-inventory/getCombineItem",
                        JSON.stringify({ item: toData.combinable.reward }),
                        function(item) {
                            $(".combine-option-text").html(
                                "<p>If you combine these items you get: <b>" +
                                item.label +
                                "</b></p>"
                            );
                        }
                    );
                    $(".combine-option-container").fadeIn(100);
                    combineslotData = [];
                    combineslotData.fromData = fromData;
                    combineslotData.toData = toData;
                    combineslotData.fromSlot = $fromSlot;
                    combineslotData.toSlot = $toSlot;
                    combineslotData.fromInv = $fromInv;
                    combineslotData.toInv = $toInv;
                    combineslotData.toAmount = $toAmount;
                    return;
                }

                fromData.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", fromData);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + fromData.label + "</p></div>";
                // if (fromData.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(fromData.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            fromData.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            fromData.image +
                            '" alt="' +
                            fromData.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            fromData.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((fromData.weight * fromData.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (fromData.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(fromData.name)) {
                    if (fromData.info.quality == undefined) {
                        fromData.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (fromData.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (fromData.info.quality > 25 && fromData.info.quality < 50) {
                        QualityColor = "rgb(230, 126, 34)";
                    } else if (fromData.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (fromData.info.quality !== undefined) {
                        qualityLabel = fromData.info.quality.toFixed();
                    } else {
                        qualityLabel = fromData.info.quality;
                    }
                    if (fromData.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                if (toData != undefined) {
                    toData.slot = parseInt($fromSlot);

                    $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").data("item", toData);

                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + toData.label + "</p></div>";
                    // if (toData.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(toData.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                toData.label +
                                "</p></div>";
                        // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                toData.image +
                                '" alt="' +
                                toData.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                toData.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((toData.weight * toData.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (toData.name.split("_")[0] == "weapon") {
                    //     if (!Inventory.IsWeaponBlocked(toData.name)) {
                        if (toData.info.quality == undefined) {
                            toData.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(127,82,0)";
                        if (toData.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (toData.info.quality > 25 && toData.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (toData.info.quality >= 50) {
                            QualityColor = "rgb(127,82,0)";
                        }
                        if (toData.info.quality !== undefined) {
                            qualityLabel = toData.info.quality.toFixed();
                        } else {
                            qualityLabel = toData.info.quality;
                        }
                        if (toData.info.quality == 0) {
                            qualityLabel = "BROKEN";
                        }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        // }
                    // }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                            toAmount: toData.amount,
                        })
                    );
                } else {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .removeClass("item-drag");
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .addClass("item-nodrag");

                    $fromInv.find("[data-slot=" + $fromSlot + "]").removeData("item");

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"></div><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>'
                            );
                    }

                    $.post(
                        "https://qb-inventory/SetInventoryData",
                        JSON.stringify({
                            fromInventory: $fromInv.attr("data-inventory"),
                            toInventory: $toInv.attr("data-inventory"),
                            fromSlot: $fromSlot,
                            toSlot: $toSlot,
                            fromAmount: $toAmount,
                        })
                    );
                }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
            } else if (
                fromData.amount > $toAmount &&
                (toData == undefined || toData == null)
            ) {
                var newDataTo = [];
                newDataTo.name = fromData.name;
                newDataTo.label = fromData.label;
                newDataTo.amount = parseInt($toAmount);
                newDataTo.type = fromData.type;
                newDataTo.description = fromData.description;
                newDataTo.image = fromData.image;
                newDataTo.weight = fromData.weight;
                newDataTo.info = fromData.info;
                newDataTo.useable = fromData.useable;
                newDataTo.unique = fromData.unique;
                newDataTo.slot = parseInt($toSlot);

                $toInv.find("[data-slot=" + $toSlot + "]").data("item", newDataTo);

                $toInv.find("[data-slot=" + $toSlot + "]").addClass("item-drag");
                $toInv.find("[data-slot=" + $toSlot + "]").removeClass("item-nodrag");

                var ItemLabel =
                    '<div class="item-slot-label"><p>' + newDataTo.label + "</p></div>";
                // if (newDataTo.name.split("_")[0] == "weapon") {
                    // if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                        ItemLabel =
                            '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                            newDataTo.label +
                            "</p></div>";
                    // }
                // }

                if ($toSlot < 6 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            $toSlot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else if ($toSlot == 43 && $toInv.attr("data-inventory") == "player") {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                } else {
                    $toInv
                        .find("[data-slot=" + $toSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataTo.image +
                            '" alt="' +
                            newDataTo.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataTo.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((newDataTo.weight * newDataTo.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        );
                }

                // if (newDataTo.name.split("_")[0] == "weapon") {
                //     if (!Inventory.IsWeaponBlocked(newDataTo.name)) {
                    if (newDataTo.info.quality == undefined) {
                        newDataTo.info.quality = 100.0;
                    }
                    var QualityColor = "rgb(127,82,0)";
                    if (newDataTo.info.quality < 25) {
                        QualityColor = "rgb(192, 57, 43)";
                    } else if (newDataTo.info.quality > 25 && newDataTo.info.quality < 50) {
                        QualityColor = "rgb(230, 126, 34)";
                    } else if (newDataTo.info.quality >= 50) {
                        QualityColor = "rgb(127,82,0)";
                    }
                    if (newDataTo.info.quality !== undefined) {
                        qualityLabel = newDataTo.info.quality.toFixed();
                    } else {
                        qualityLabel = newDataTo.info.quality;
                    }
                    if (newDataTo.info.quality == 0) {
                        qualityLabel = "BROKEN";
                    }
                        $toInv
                            .find("[data-slot=" + $toSlot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    // }
                // }

                var newDataFrom = [];
                newDataFrom.name = fromData.name;
                newDataFrom.label = fromData.label;
                newDataFrom.amount = parseInt(fromData.amount - $toAmount);
                newDataFrom.type = fromData.type;
                newDataFrom.description = fromData.description;
                newDataFrom.image = fromData.image;
                newDataFrom.weight = fromData.weight;
                newDataFrom.price = fromData.price;
                newDataFrom.info = fromData.info;
                newDataFrom.useable = fromData.useable;
                newDataFrom.unique = fromData.unique;
                newDataFrom.slot = parseInt($fromSlot);

                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .data("item", newDataFrom);

                $fromInv.find("[data-slot=" + $fromSlot + "]").addClass("item-drag");
                $fromInv
                    .find("[data-slot=" + $fromSlot + "]")
                    .removeClass("item-nodrag");

                if ($fromInv.attr("data-inventory").split("-")[0] == "itemshop") {
                    $fromInv
                        .find("[data-slot=" + $fromSlot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            newDataFrom.image +
                            '" alt="' +
                            newDataFrom.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            newDataFrom.amount +
                            '</div><div class="item-slot-name1"><p>' +
                            " £" +
                            newDataFrom.price +
                            '</p></div><div class="item-slot-label"><p>' +
                            newDataFrom.label +
                            "</p></div>"
                        );
                } else {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' +
                        newDataFrom.label +
                        "</p></div>";
                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                            ItemLabel =
                                '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' +
                                newDataFrom.label +
                                "</p></div>";
                        // }
                    // }

                    if ($fromSlot < 6 && $fromInv.attr("data-inventory") == "player") {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"><p>' +
                                $fromSlot +
                                '</p></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else if (
                        $fromSlot == 43 &&
                        $fromInv.attr("data-inventory") == "player"
                    ) {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $fromInv
                            .find("[data-slot=" + $fromSlot + "]")
                            .html(
                                '<div class="item-slot-img"><img src="images/' +
                                newDataFrom.image +
                                '" alt="' +
                                newDataFrom.name +
                                '" /></div><div class="item-slot-amount"><p>' +
                                newDataFrom.amount +
                                '</div><div class="item-slot-name"><p>' +
                                " " +
                                ((newDataFrom.weight * newDataFrom.amount) / 1000).toFixed(
                                    1
                                ) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }

                    // if (newDataFrom.name.split("_")[0] == "weapon") {
                    //     if (!Inventory.IsWeaponBlocked(newDataFrom.name)) {
                        if (newDataFrom.info.quality == undefined) {
                            newDataFrom.info.quality = 100.0;
                        }
                        var QualityColor = "rgb(127,82,0)";
                        if (newDataFrom.info.quality < 25) {
                            QualityColor = "rgb(192, 57, 43)";
                        } else if (newDataFrom.info.quality > 25 && newDataFrom.info.quality < 50) {
                            QualityColor = "rgb(230, 126, 34)";
                        } else if (newDataFrom.info.quality >= 50) {
                            QualityColor = "rgb(127,82,0)";
                        }
                        if (newDataFrom.info.quality !== undefined) {
                            qualityLabel = newDataFrom.info.quality.toFixed();
                        } else {
                            qualityLabel = newDataFrom.info.quality;
                        }
                        if (newDataFrom.info.quality == 0) {
                            qualityLabel = "BROKEN";
                        }
                            $fromInv
                                .find("[data-slot=" + $fromSlot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        // }
                    // }
                        }
                $.post("https://qb-inventory/PlayDropSound", JSON.stringify({}));
                $.post(
                    "https://qb-inventory/SetInventoryData",
                    JSON.stringify({
                        fromInventory: $fromInv.attr("data-inventory"),
                        toInventory: $toInv.attr("data-inventory"),
                        fromSlot: $fromSlot,
                        toSlot: $toSlot,
                        fromAmount: $toAmount,
                    })
                );
            } else {
                InventoryError($fromInv, $fromSlot);
            }
        }
    } else {
        //InventoryError($fromInv, $fromSlot);
    }
    handleDragDrop();
}

function isItemAllowed(item, allowedItems) {
    var retval = false;
    $.each(allowedItems, function(index, i) {
        if (i == item) {
            retval = true;
        }
    });
    return retval;
}

function InventoryError($elinv, $elslot) {
    $elinv
        .find("[data-slot=" + $elslot + "]")
        .css("background", "rgba(156, 20, 20, 0.5)")
        .css("transition", "background 500ms");
    setTimeout(function() {
        $elinv
            .find("[data-slot=" + $elslot + "]")
            .css("background", "rgba(255, 255, 255, 0.3)");
    }, 500);
    $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
}

var requiredItemOpen = false;

(() => {
    Inventory = {};

    Inventory.slots = 40;

    Inventory.dropslots = 30;
    Inventory.droplabel = "Pe jos";
    Inventory.dropmaxweight = 100000;

    Inventory.Error = function() {
        $.post("https://qb-inventory/PlayDropFail", JSON.stringify({}));
    };

    Inventory.IsWeaponBlocked = function(WeaponName) {
        var DurabilityBlockedWeapons = [
            "weapon_unarmed",
            "weapon_stickybomb",
        ];

        var retval = false;
        $.each(DurabilityBlockedWeapons, function(i, name) {
            if (name == WeaponName) {
                retval = true;
            }
        });
        return retval;
    };

    Inventory.QualityCheck = function (item, IsHotbar, IsOtherInventory) {
        // if (!Inventory.IsWeaponBlocked(item.name)) {
        //     if (item.name.split("_")[0] == "weapon") {
                if (item.info.quality == undefined) {
                    item.info.quality = 100;
                }
                var QualityColor = "rgb(127,82,0)";
                if (item.info.quality < 25) {
                    QualityColor = "rgb(192, 57, 43)";
                } else if (item.info.quality > 25 && item.info.quality < 50) {
                    QualityColor = "rgb(230, 126, 34)";
                } else if (item.info.quality >= 50) {
                    QualityColor = "rgb(127,82,0)";
                }
                if (item.info.quality !== undefined) {
                    qualityLabel = item.info.quality.toFixed();
                } else {
                    qualityLabel = item.info.quality;
                }
                if (item.info.quality == 0) {
                    qualityLabel = "BROKEN";
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".ply-hotbar-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    height: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                            $(".player-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    height: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory")
                                .find("[data-zhotbarslot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    height: "100%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                height: "100%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                } else {
                    if (!IsOtherInventory) {
                        if (!IsHotbar) {
                            $(".player-inventory")
                                .find("[data-slot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        } else {
                            $(".z-hotbar-inventory")
                                .find("[data-zhotbarslot=" + item.slot + "]")
                                .find(".item-slot-quality-bar")
                                .css({
                                    width: qualityLabel + "%",
                                    "background-color": QualityColor,
                                })
                                .find("p")
                                .html(qualityLabel);
                        }
                    } else {
                        $(".other-inventory")
                            .find("[data-slot=" + item.slot + "]")
                            .find(".item-slot-quality-bar")
                            .css({
                                width: qualityLabel + "%",
                                "background-color": QualityColor,
                            })
                            .find("p")
                            .html(qualityLabel);
                    }
                }
            // }
        // }
    };

Inventory.Open = function(data) {
    totalWeight = 0;
    totalWeightOther = 0;

    // Log de depanare pentru a inspecta datele primite
    let inventoryLog = "Player inventory:\n";
    if (data.inventory && typeof data.inventory === "object") {
        Object.values(data.inventory).forEach(item => {
            inventoryLog += `  Item: ${item?.name || "Unknown"}, Quality: ${item?.info?.quality ?? "undefined"}\n`;
        });
    } else {
        inventoryLog += "  Invalid inventory: " + JSON.stringify(data.inventory || {}) + "\n";
    }
    let otherLog = "Other inventory:\n";
    if (data.other && data.other.inventory && typeof data.other.inventory === "object") {
        Object.values(data.other.inventory).forEach(item => {
            otherLog += `  Item: ${item?.name || "Unknown"}, Quality: ${item?.info?.quality ?? "undefined"}\n`;
        });
    } else {
        otherLog += "  Invalid other inventory: " + JSON.stringify(data.other || {}) + "\n";
    }
    console.log(inventoryLog + otherLog);

    $('.health-system').css('left', '-50%');
    $('.health-system').css('display', 'none');
    $('.inventory-search-input-box').val('');
    $(".player-inv-label").html('Buzunare');
    $(".player-inventory").find(".item-slot").remove();
    $(".player-inventory-backpack").find(".item-slot").remove();
    $(".ply-hotbar-inventory").find(".item-slot").remove();
    $(".ply-iteminfo-container").css("display", "none");
    $('.item-shit').css('display', 'none');
    $('.item-info-description').css('display', 'block');

    $(".personal-vehicle-title").html('Vehicul Personal');
    $(".personal-vehicle").html('N/A');

    $(".player-id-title").html(data.pName);
    $(".player-id").html('CNP: ' + data.pCID);

    $(".phone-number-title").html('Numar telefon');
    $(".phone-number").html(data.pNumber);

    $(".apartment-id-apartment").html('N/A');
    if (data.apartment) {
        $(".apartment-id-apartment").html("" + data.apartment.apartment_label + ", Room: " + data.apartment.room_id);
    }

    let pHead = 100 - data.pHeadDamage;
    $(".head .progress").css("width", pHead + "%");

    let pRArm = 100 - data.pRArmDamage;
    $(".right-arm .progress").css("width", pRArm + "%");

    let pLArm = 100 - data.pLArmDamage;
    $(".left-arm .progress").css("width", pLArm + "%");

    let pBody = 100 - data.pBodyDamage;
    $(".body .progress").css("width", pBody + "%");

    let pRLeg = 100 - data.pRLegDamage;
    $(".right-leg .progress").css("width", pRLeg + "%");

    let pLLeg = 100 - data.pLLegDamage;
    $(".left-leg .progress").css("width", pLLeg + "%");

    if (requiredItemOpen) {
        $(".requiredItem-container").hide();
        requiredItemOpen = false;
    }

    $("#qbcore-inventory").fadeIn(300);
    if (data.other != null && data.other != "") {
        $(".other-inventory").attr("data-inventory", data.other.name);
    } else {
        $(".other-inventory").attr("data-inventory", 0);
    }

    var backpackSlots = $(".player-inventory-backpack");
    for (i = 1; i < 16; i++) {
        backpackSlots.append(
            '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"></div><div class="item-slot-label"><p> </p></div></div>'
        );
    }
    $(".player-inventory").append(backpackSlots);

    var remainingSlots = $(".player-inventory");
    for (i = 16; i < 40 + 1; i++) {
        remainingSlots.append(
            '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"></div><div class="item-slot-label"><p> </p></div></div>'
        );
    }
    $(".player-inventory").append(remainingSlots);

    var leftboxes = $(".player-body-leftboxes");
    for (let i = 41; i <= 45; i++) {
        let tip = leftData[i]; 
        let faClass = iconMap[tip] || "fa-question";
        leftboxes.append(
            `<div class="item-slot special-slot" data-slot="${i}" data-required="${tip}">
               <i class="fa-solid ${faClass} slot-required-icon"></i>
               <div class="item-slot-img"></div>
               <div class="item-slot-label"><p> </p></div>
            </div>`
        );
    }
    $(".player-inventory-backpack").append(leftboxes);

    var rightboxes = $(".player-body-rightboxes");
    for (let i = 46; i <= 50; i++) {
        let tip = rightData[i]; 
        let faClass = iconMap[tip] || "fa-question";
        rightboxes.append(
            `<div class="item-slot special-slot" data-slot="${i}" data-required="${tip}">
               <i class="fa-solid ${faClass} slot-required-icon"></i>
               <div class="item-slot-img"></div>
               <div class="item-slot-label"><p> </p></div>
            </div>`
        );
    }
    $(".player-inventory-backpack").append(rightboxes);

    if (data.other != null && data.other != "") {
        for (i = 1; i < data.other.slots + 1; i++) {
            $(".other-inventory").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"></div><div class="item-slot-label"><p> </p></div></div>'
            );
        }
    } else {
        for (i = 1; i < Inventory.dropslots + 1; i++) {
            $(".other-inventory").append(
                '<div class="item-slot" data-slot="' +
                i +
                '"><div class="item-slot-img"></div><div class="item-slot-label"><p> </p></div></div>'
            );
        }
        $(".other-inventory .item-slot").css({
            "background-color": "rgba(23, 27, 43, 0.5)"
        });
    }

    if (data.inventory !== null) {
        $.each(data.inventory, function(i, item) {
            if (item != null) {
                totalWeight += item.weight * item.amount;
                var ItemLabel = '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' + item.label + "</p></div>";
                if (item.slot < 6) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            item.slot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="inv-item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        )
                        .data("item", item);
                } else if (item.slot == 43) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag")
                        .html(
                            '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        )
                        .data("item", item);
                } else {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="inv-item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            "</p></div>" +
                            ItemLabel
                        )
                        .data("item", item);
                }
            }
        });
    }

    if (data.other != null && data.other != "" && data.other.inventory != null) {
        $.each(data.other.inventory, function(i, item) {
            if (item != null) {
                totalWeightOther += item.weight * item.amount;
                var ItemLabel = '<div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label"><p>' + item.label + "</p></div>";
                $(".other-inventory")
                    .find("[data-slot=" + item.slot + "]")
                    .addClass("item-drag");
                if (item.price != null) {
                    $(".item-slot-name > p").css("display", "block");
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class="item-slot-name1"><p>' +
                            " £" +
                            item.price +
                            "</p></div>" +
                            ItemLabel
                        )
                        .data("item", item);
                } else {
                    $(".other-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</p></div><div class=""><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000) +
                            "</p></div>" +
                            ItemLabel
                        )
                        .data("item", item);
                }
            }
        });
    }

    // Reaplica Inventory.QualityCheck pentru toate sloturile dupa populare
    $(".player-inventory .item-slot").each(function() {
        var item = $(this).data("item");
        if (item && item.info && typeof item.info === "object") {
            Inventory.QualityCheck(item, false, false);
        }
    });
    $(".other-inventory .item-slot").each(function() {
        var item = $(this).data("item");
        if (item && item.info && typeof item.info === "object") {
            Inventory.QualityCheck(item, false, true);
        }
    });

    var per = (totalWeight / 1000) / (data.maxweight / 100000);
    $(".pro").css("width", per + "%");
    $("#player-inv-weight").html(
        (totalWeight / 1000) +
        "kg /" +
        (data.maxweight / 1000) + "kg"
    );
    playerMaxWeight = data.maxweight;
    if (data.other != null) {
        var name = data.other.name.toString();
        if (
            name != null &&
            (name.split("-")[0] == "itemshop" || name == "crafting")
        ) {
            $("#other-inv-label").html(data.other.label);
        } else {
            $("#other-inv-label").html(data.other.label);
            $("#other-inv-weight").html(
                (totalWeightOther / 1000) +
                "kg /" +
                (data.other.maxweight / 1000) + "kg"
            );
        }
        otherMaxWeight = data.other.maxweight;
        otherLabel = data.other.label;
        var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000);
        $(".pro1").css("width", per1 + "%");
    } else {
        $("#other-inv-label").html(Inventory.droplabel);
        $("#other-inv-weight").html(
            (totalWeightOther / 1000) +
            "kg /" +
            (Inventory.dropmaxweight / 1000) + "kg"
        );
        otherMaxWeight = Inventory.dropmaxweight;
        otherLabel = Inventory.droplabel;
        var per1 = (totalWeightOther / 1000) / (otherMaxWeight / 100000);
        $(".pro1").css("width", per1 + "%");
    }

    $.each(data.maxammo, function(index, ammotype) {
        $("#" + index + "_ammo")
            .find(".ammo-box-amount")
            .css({ height: "0%" });
    });

    if (data.Ammo !== null) {
        $.each(data.Ammo, function(i, amount) {
            var Handler = i.split("_");
            var Type = Handler[1].toLowerCase();
            if (amount > data.maxammo[Type]) {
                amount = data.maxammo[Type];
            }
            var Percentage = (amount / data.maxammo[Type]) * 100;

            $("#" + Type + "_ammo")
                .find(".ammo-box-amount")
                .css({ height: Percentage + "%" });
            $("#" + Type + "_ammo")
                .find("span")
                .html(amount);
        });
    }

    handleDragDrop();

    weaponsName = data["weapons"];
    settingsName = data.filter["settings"];
    foodsName = data.filter["foods"];
    clothesName = data.filter["clothes"];
    materialName = data.filter["materials"];

    let specialWeightkg = getSpecialBoxesWeight();
    $(".special-weight").text(specialWeightkg + "kg /20kg");
};


var filter = false
$(document).on("click", ".item-box-list svg", function (e) {
    e.preventDefault();
    var item = $(this).data("type");
    var controller = false

    if (filter) {
        $(".player-inventory .item-slot").css('opacity', '1');
        filter = false;
        return;
    }

    var itemList;
    switch (item) {
        case "weaponsName":
            itemList = weaponsName;
            controller = true
            break;
        case "materialName":
            itemList = materialName;
            break;
        case "clothesName":
            itemList = clothesName;
            break;
        case "foodsName":
            itemList = foodsName;
            break;
        case "settingsName":
            itemList = settingsName;
            break;

        default:
            itemList = [];
            break;
    }
    $(".player-inventory .item-slot").each(function () {
        var html = $(this).find(".item-slot-label p").html().toLowerCase();
        var itemFound = false;

        if (controller) {
            if (html.indexOf("&nbsp;") === -1) {
                itemList.forEach(function(itemText) {
                    if (html.indexOf(itemText.toLowerCase()) !== -1) {
                        itemFound = true;
                    }
                });
            }
        }

        if (html.indexOf("&nbsp;") === -1 && !controller) {
            itemList.forEach(function(itemText) {
                if (html.indexOf(itemText.name.toLowerCase()) !== -1) {
                    itemFound = true;
                }
            });
        }

        if (!itemFound) {
            $(this).css('opacity', '0.3');
        } else {
            $(this).css('opacity', '1');
        }
    });

    filter = !filter;
});

$(document).on("click", ".settings-button", function (e) {
    if ($(this).data("type") == "settings") {
        $('.help-box').css('display', 'block');       
    }
})

$(document).on("click", "#MDRSTopDivRight", function (e) {
    Inventory.Close();
})

$(document).on("click", ".helpclose", function (e) {
    $('.help-box').css('display', 'none');       
})

    Inventory.Close = function() {
        // $(".item-slot").css("border", "1px solid rgba(255, 255, 255, 0.1)");
        $(".ply-hotbar-inventory").css("display", "block");
        // $(".ply-iteminfo-container").css("display", "none");
        $(".ply-iteminfo-container").css("display", "none");
        $('.item-shit').css('display', 'none');
        $('.item-info-description').css('display', 'block');
        $("#qbcore-inventory").fadeOut(300);
        $(".combine-option-container").hide();
        $(".item-slot").remove();
        if ($("#rob-money").length) {
            $("#rob-money").remove();
        }
        $.post("https://qb-inventory/CloseInventory", JSON.stringify({}));

        if (AttachmentScreenActive) {
            $("#qbcore-inventory").css({ left: "0vw" });
            $(".weapon-attachments-container").css({ left: "-100vw" });
            AttachmentScreenActive = false;
        }

        if (ClickedItemData !== null) {
            $("#weapon-attachments").fadeOut(250, function() {
                $("#weapon-attachments").remove();
                ClickedItemData = {};
            });
        }
    };

    Inventory.Update = function(data) {
        updateRequirementIcons()
        totalWeight = 0;
        totalWeightOther = 0;
        $(".player-inventory").find(".item-slot").remove();
        $(".player-inventory-backpack").find(".item-slot").remove();
        $(".player-inventory-first").find(".item-slot").remove();
        $(".player-inventory-second").find(".item-slot").remove();
        $(".ply-hotbar-inventory").find(".item-slot").remove();
        if (data.error) {
            Inventory.Error();
        }

        var backpackSlots = $(".player-inventory-backpack");
        for (i = 1; i < 16; i++) {
            backpackSlots.append(
                '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        $(".player-inventory").append(backpackSlots);

        var remainingSlots = $(".player-inventory");
        for (i = 16; i < 40 + 1; i++) {
        {
                remainingSlots.append(
                    '<div class="item-slot" data-slot="' +
                    i +
                    '"><div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div></div>'
                );
            }
        }
        $(".player-inventory").append(remainingSlots);

        var leftboxes = $(".player-body-leftboxes");
        for (let i = 41; i <= 45; i++) {
            // tipul cerut:
            let tip = leftData[i]; 
            // icon-ul => cau?i în iconMap
            let faClass = iconMap[tip] || "fa-question"; // fallback daca nu exista
        
            leftboxes.append(
                `<div class="item-slot special-slot" data-slot="${i}" data-required="${tip}">
                   <i class="fa-solid ${faClass} slot-required-icon"></i>
                   <div class="item-slot-img"></div>
                   <div class="item-slot-label"><p>&nbsp;</p></div>
                </div>`
            );
        }
        $(".player-inventory-backpack").append(leftboxes);

        var rightboxes = $(".player-body-rightboxes");
        for (let i = 46; i <= 50; i++) {
            let tip = rightData[i]; 
            let faClass = iconMap[tip] || "fa-question";
        
            rightboxes.append(
                `<div class="item-slot special-slot" data-slot="${i}" data-required="${tip}">
                   <i class="fa-solid ${faClass} slot-required-icon"></i>
                   <div class="item-slot-img"></div>
                   <div class="item-slot-label"><p>&nbsp;</p></div>
                </div>`
            );
        }
        $(".player-inventory-backpack").append(rightboxes);

        $.each(data.inventory, function(i, item) {
            if (item != null) {
                totalWeight += item.weight * item.amount;
                if (item.slot < 6) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"><p>' +
                            item.slot +
                            '</p></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else if (item.slot == 43) {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-key"></div><div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                } else {
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .addClass("item-drag");
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .html(
                            '<div class="item-slot-img"><img src="images/' +
                            item.image +
                            '" alt="' +
                            item.name +
                            '" /></div><div class="item-slot-amount"><p>' +
                            item.amount +
                            '</div><div class="item-slot-name"><p>' +
                            " " +
                            ((item.weight * item.amount) / 1000).toFixed(1) +
                            '</p></div><div class="item-slot-label"><p>' +
                            item.label +
                            "</p></div>"
                        );
                    $(".player-inventory")
                        .find("[data-slot=" + item.slot + "]")
                        .data("item", item);
                }
            }
        });

        var per =(totalWeight/1000)/(data.maxweight/100000)
        $(".pro").css("width",per+"%");
        $("#player-inv-weight").html(
            // '<i class="fas fa-dumbbell"></i> ' +
            (totalWeight / 1000) +
            "kg /" +
            (data.maxweight / 1000) + "kg" // buzunare
        );

        handleDragDrop();

        let specialWeightkg = getSpecialBoxesWeight();
        $(".special-weight").text(specialWeightkg + "kg /20kg"); //special shit
    };

    Inventory.ToggleHotbar = function(data) {
        if (data.open) {
            $(".z-hotbar-inventory").html("");
            for (i = 1; i < 6; i++) {
                var elem =
                    '<div class="z-hotbar-item-slot" data-zhotbarslot="' +
                    i +
                    '"> <div class="z-hotbar-item-slot-key"><p>' +
                    i +
                    '</p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
                $(".z-hotbar-inventory").append(elem);
            }
            // var elem =
            //     '<div class="z-hotbar-item-slot" data-zhotbarslot="43"> <div class="z-hotbar-item-slot-key"><p>6 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"></div><div class="z-hotbar-item-slot-label"><p>&nbsp;</p></div></div>';
            // $(".z-hotbar-inventory").append(elem);
            $.each(data.items, function(i, item) {
                if (item != null) {
                    var ItemLabel =
                        '<div class="item-slot-label"><p>' + item.label + "</p></div>";
                    // if (item.name.split("_")[0] == "weapon") {
                        // if (!Inventory.IsWeaponBlocked(item.name)) {
                            ItemLabel =
                                '<div class=""><div class=""><p></p></div></div><div class="item-slot-label"><p>' +
                                item.label +
                                "</p></div>";
                        // }
                    // }
                    if (item.slot == 43) {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>6 <i style="top: -62px; left: 58px;" class="fas fa-lock"></i></p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    } else {
                        $(".z-hotbar-inventory")
                            .find("[data-zhotbarslot=" + item.slot + "]")
                            .html(
                                '<div class="z-hotbar-item-slot-key"><p>' +
                                item.slot +
                                '</p></div><div class="z-hotbar-item-slot-img"><img src="images/' +
                                item.image +
                                '" alt="' +
                                item.name +
                                '" /></div><div class="z-hotbar-item-slot-amount"><p>' +
                                item.amount +
                                '</div><div class="z-hotbar-item-slot-amount-name"><p>' +
                                " " +
                                ((item.weight * item.amount) / 1000).toFixed(1) +
                                "</p></div>" +
                                ItemLabel
                            );
                    }
                    Inventory.QualityCheck(item, true, false);
                }
            });
            $(".z-hotbar-inventory").fadeIn(150);
        } else {
            $(".z-hotbar-inventory").fadeOut(150, function() {
                $(".z-hotbar-inventory").html("");
            });
        }
    };

  Inventory.UseItem = function (data) {
        // setTimeout(() => {
        //  $('.notify , body').css('display', 'block');
        //  $(".notify").animate({
        //     left: "0%"
        // }, 1000);

        //  $('.notify .item-name').html(data.label);
        //  $('.notify .item-count').html(data.amount);
        //  $('.notify .item-img img').attr('src', 'images/' + data.image);
        
        // }, 500);
        // setTimeout(function () {
        //     $(".notify").animate({
        //         left: "-20%"
        //     }, 1000);
        // }, 3000);
        // $('.notify , body').css('display', 'none');

    };

window.addEventListener('message', function(event) {
    let data = event.data;
    if (data.action === "showNotification") {
        Inventory.itemBox(data.data);
    } else if (data.action === "UpdateSlot") {
        let slot = data.slot;
        let item = data.item;

        let $slot = $(".player-inventory").find("[data-slot='" + slot + "']");
        if (item != null) {
            // Update slot with new item data
            // Example:
            $slot.data("item", item);
            $slot.html(/* create HTML for item with amount, image, etc. */);
            $slot.addClass("item-drag");
            $slot.removeClass("item-nodrag");
        } else {
            // Empty slot if item == null
            $slot.removeData("item");
            $slot.html('<div class="item-slot-img"></div><div class="item-slot-label"><p>&nbsp;</p></div>');
            $slot.removeClass("item-drag").addClass("item-nodrag");
        }
    } else if (data.action === "SplitSuccess") {
        let itemName = data.itemName;
        let amount = data.amount;

        // After splitting, request to refresh inventory if needed
        $.post("https://qb-inventory/refreshInventory", JSON.stringify({}), function(inventory) {
            let newSlot = null;
            for (let i in inventory) {
                let itm = inventory[i];
                if (itm.name == itemName && itm.amount == amount) {
                    newSlot = itm.slot;
                    break;
                }
            }

            if (newSlot != null) {
                let $slot = $(".player-inventory").find("[data-slot='" + newSlot + "']");
                if ($slot.length > 0) {
                    let itemData = $slot.data("item");
                    if (itemData) {
                        IsDragging = true;
                        let $clone = $slot.clone();
                        $clone.addClass("ui-draggable-dragging");
                        $("body").append($clone);
                        $clone.css({
                            "position": "absolute",
                            "top": event.clientY + "px",
                            "left": event.clientX + "px"
                        });

                        $('body').on("mousemove.splitDrag", function(e) {
                            $clone.css({
                                "top": e.clientY + "px",
                                "left": e.clientX + "px"
                            });
                        });
                    }
                }
            }
        });
    }
});

Inventory.itemBox = function(data) {
    var body = $('body').css('display');

    // Clone the first notify element as a template
    var newNotify = $('.notify').first().clone();
    $('body').append(newNotify); // Append it to the body

    // Generate a unique suffix for IDs
    var uniqueSuffix = Date.now(); // Ensures unique IDs based on timestamp

    // Fix SVG <defs> IDs and their references
    var svg = newNotify.find('svg.notify-svg');

    svg.find('defs [id]').each(function () {
        var oldId = $(this).attr('id'); // Get the original ID
        var newId = oldId + '_' + uniqueSuffix; // Create a unique ID
        $(this).attr('id', newId); // Update the ID to be unique

        // Update all references to this ID (e.g., in fill or stroke attributes)
        svg.find('*').each(function () {
            if ($(this).attr('fill') === `url(#${oldId})`) {
                $(this).attr('fill', `url(#${newId})`);
            }
            if ($(this).attr('stroke') === `url(#${oldId})`) {
                $(this).attr('stroke', `url(#${newId})`);
            }
        });
    });

    // Set initial styles for animation
    newNotify.css({
        'left': '-20%', // Start off-screen to the left
        'display': 'block', // Make sure it's visible
        'top': 'auto', // Auto top for dynamic calculation later
        'bottom': '25%' // Start from 10% from the bottom
    });

    // Update contents based on passed data
    newNotify.find('.item-name').html(data.item.label);
    newNotify.find('.item-count').html(data.itemAmount + 'x');
    newNotify.find('.item-img img').attr('src', 'images/' + data.item.image);
    newNotify.find('.item-img img').attr('alt', data.item.label);
    // Customize based on type
    switch (data.type) {
        case "add":
            newNotify.find('.item-type').html("Adaugat");
            newNotify.find('.item-count').css('left', '63.5%').html('x' + data.itemAmount);
            break;
        case "remove":
            newNotify.find('.item-type').html("Sters");
            newNotify.find('.item-count').css('left', '57%').html('x' + data.itemAmount);
            break;
        case "use":
            newNotify.find('.item-type').html("Folosit");
            newNotify.find('.item-count').css('left', '60.5%').html('x' + data.itemAmount);
            break;
    }

    // Calculate offset to prevent overlapping
    var offset = ($('.notify').length - 1) * 82; // Adjust the height of each notification if needed
    newNotify.css('bottom', `calc(25% + ${offset}px)`); // Stack upward without overlapping

    // Animate the notification into view
    newNotify.animate({left: "0%"}, 1000);

    // Automatically hide and remove the notification after some time
    setTimeout(() => {
        newNotify.animate({left: "-100%"}, 2500, function() {
            $(this).remove(); // Remove from DOM after hiding
        });
    }, 2501);

    // Re-show body if it was hidden
    if (body === 'none') {
        $('body').css('display', 'block');
    }
};

    Inventory.RequiredItem = function(data) {
        if (requiredTimeout !== null) {
            clearTimeout(requiredTimeout);
        }
        if (data.toggle) {
            if (!requiredItemOpen) {
                $(".requiredItem-container").html("");
                $.each(data.items, function(index, item) {
                    var element =
                        '<div class="requiredItem-box"><div id="requiredItem-action">Required</div><div id="requiredItem-label"><p>' +
                        item.label +
                        '</p></div><div id="requiredItem-image"><div class="item-slot-img"><img src="images/' +
                        item.image +
                        '" alt="' +
                        item.name +
                        '" /></div></div></div>';
                    $(".requiredItem-container").hide();
                    $(".requiredItem-container").append(element);
                    $(".requiredItem-container").fadeIn(100);
                });
                requiredItemOpen = true;
            }
        } else {
            $(".requiredItem-container").fadeOut(100);
            requiredTimeout = setTimeout(function() {
                $(".requiredItem-container").html("");
                requiredItemOpen = false;
            }, 100);
        }
    };

    window.onload = function(e) {
        window.addEventListener("message", function(event) {
            switch (event.data.action) {
                case "open":
                    Inventory.Open(event.data);
                    break;
                case "close":
                    Inventory.Close();
                    break;
                case "update":
                    Inventory.Update(event.data);
    		    // Here is where you re-apply the quality bars after updating.
                   $(".player-inventory .item-slot").each(function() {
                   var item = $(this).data("item");
                   if (item && item.info && item.info.quality !== undefined) {
                  // Ensure the item slot has the item-slot-quality structure
                  // If you haven't added this in Inventory.Update, add it now:
                  // Example:
                  let html = $(this).html();
                  if (html.indexOf("item-slot-quality") === -1) {
                     html = html.replace('</div><div class="item-slot-label">',
                     '</div><div class="item-slot-quality"><div class="item-slot-quality-bar"><p>100</p></div></div><div class="item-slot-label">');
                   $(this).html(html);
                  }

            // Now call QualityCheck
            Inventory.QualityCheck(item, false, false);	       
         }
    });
    break;
                case "itemBox":
                    Inventory.itemBox(event.data);
                    break;
                case "requiredItem":
                    Inventory.RequiredItem(event.data);
                    break;
                case "toggleHotbar":
                    Inventory.ToggleHotbar(event.data);
                    break;
                case "RobMoney":
                    $(".inv-options-list").append(
                        '<div class="inv-option-item" id="rob-money"><p><i style="margin-top: 1rem" class="fas fa-hand-holding-dollar"></i></p></div>'
                    );
                    $("#rob-money").data("TargetId", event.data.TargetId);
                    break;
            }
        });
    };
})();

$(document).on("click", "#rob-money", function(e) {
    e.preventDefault();
    var TargetId = $(this).data("TargetId");
    $.post(
        "https://qb-inventory/RobMoney",
        JSON.stringify({
            TargetId: TargetId,
        })
    );
    $("#rob-money").remove();
});

// Item Search  //

$(".invsearch-input").on("input", function () {
    var val = $(this).val().toLowerCase();

    $(".player-inventory .item-slot").each(function () {
        var html = $(this).find(".item-slot-label").html().toLowerCase();

        if (html.indexOf("&nbsp;") === -1) {
            if (html.indexOf(val) === -1) {
                $(this).css('opacity', '0.3');
            } else {
                $(this).css('opacity', '1');
            }
        }
    });
});
