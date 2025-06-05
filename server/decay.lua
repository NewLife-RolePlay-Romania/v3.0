local QBCore = exports['qb-core']:GetCoreObject()
local TimeAllowed = 60 * 60 * 24 * 2 -- 2 zile

function ConvertQuality(item)
    if not item.name or type(item.name) ~= "string" then
        -- print("DECAY ERROR: Item name is invalid or missing =>", json.encode(item))
        return 100
    end
    
    local StartDate = item.created
    local itemDef = QBCore.Shared.Items[item.name:lower()]
    
    if not itemDef then
        -- print("DECAY WARNING: Item not found in QBCore.Shared.Items =>", item.name)
        return 100
    end

    local DecayRate = itemDef.decay or 0.0
    if DecayRate == nil then
        DecayRate = 0
    end
    local TimeExtra = math.ceil((TimeAllowed * DecayRate))
    local percentDone = 100 - math.ceil((((os.time() - StartDate) / TimeExtra) * 100))
    if DecayRate == 0 then
        percentDone = 100
    end
    if percentDone < 0 then
        percentDone = 0
    end
    return percentDone
end

QBCore.Functions.CreateCallback('inventory:server:ConvertQuality', function(source, cb, inventory, other, id)
    local src = source
    local data = {}
    local Player = QBCore.Functions.GetPlayer(src)
    
    if inventory and type(inventory) == "table" then
        for k, item in pairs(inventory) do
            if item.created then
                local itemDef = QBCore.Shared.Items[item.name and item.name:lower() or ""]
                -- print("Processing player inventory item:", item.name, "Created:", item.created, "Decay:", itemDef and itemDef.decay or "none", "Initial Quality:", item.info and item.info.quality or "none")
                if not item.name or type(item.name) ~= "string" then
                    -- print("DECAY ERROR: Invalid item name in inventory =>", json.encode(item))
                    if item.info then
                        item.info.quality = 100
                    else
                        item.info = { quality = 100 }
                    end
                    -- print("Set player inventory item (invalid name):", item.name or "Unknown", "Final Quality:", item.info.quality)
                else
                    if itemDef and itemDef.decay and itemDef.decay ~= 0 then
                        if not item.info or type(item.info) ~= "table" then
                            item.info = { quality = 100 }
                        end
                        local quality = ConvertQuality(item)
                        item.info.quality = quality
                        -- print("Set player inventory item (with decay):", item.name, "Final Quality:", item.info.quality)
                    else
                        if item.info and item.info.quality and type(item.info.quality) == "number" and item.info.quality >= 0 and item.info.quality <= 100 then
                            -- print("Preserved player inventory item quality:", item.name, "Final Quality:", item.info.quality)
                        else
                            if item.info then
                                item.info.quality = 100
                            else
                                item.info = { quality = 100 }
                            end
                            -- print("Set player inventory item (no decay, no valid quality):", item.name, "Final Quality:", item.info.quality)
                        end
                    end
                end
            else
                -- print("Skipped player inventory item (no created):", item.name or "Unknown")
            end
        end
        -- Salveaza inventarul jucatorului
        if Player then
            Player.PlayerData.items = inventory
            Player.Functions.Save()
        end
    else
        -- print("DECAY WARNING: Invalid player inventory:", inventory)
    end

    if other and other.inventory then
        for k, item in pairs(other.inventory) do
            if item.created then
                local itemDef = QBCore.Shared.Items[item.name and item.name:lower() or ""]
                -- print("Processing other inventory item:", item.name, "Created:", item.created, "Decay:", itemDef and itemDef.decay or "none", "Initial Quality:", item.info and item.info.quality or "none")
                if not item.name or type(item.name) ~= "string" then
                    -- print("DECAY ERROR: Invalid item name in other inventory =>", json.encode(item))
                    if item.info then
                        item.info.quality = 100
                    else
                        item.info = { quality = 100 }
                    end
                    -- print("Set other inventory item (invalid name):", item.name or "Unknown", "Final Quality:", item.info.quality)
                else
                    if itemDef and itemDef.decay and itemDef.decay ~= 0 then
                        if not item.info or type(item.info) ~= "table" then
                            item.info = { quality = 100 }
                        end
                        local quality = ConvertQuality(item)
                        item.info.quality = quality
                        -- print("Set other inventory item (with decay):", item.name, "Final Quality:", item.info.quality)
                    else
                        if item.info and item.info.quality and type(item.info.quality) == "number" and item.info.quality >= 0 and item.info.quality <= 100 then
                            -- print("Preserved other inventory item quality:", item.name, "Final Quality:", item.info.quality)
                        else
                            if item.info then
                                item.info.quality = 100
                            else
                                item.info = { quality = 100 }
                            end
                            -- print("Set other inventory item (no decay, no valid quality):", item.name, "Final Quality:", item.info.quality)
                        end
                    end
                end
            else
                -- print("Skipped other inventory item (no created):", item.name or "Unknown")
            end
        end
    else
        -- print("DECAY WARNING: Invalid other inventory:", other)
    end

    if id then
        if Gloveboxes[id] then
            local GlobeBoxItems = GetOwnedVehicleGloveboxItems(id)
            for k, item in pairs(GlobeBoxItems) do
                if item.created then
                    local itemDef = QBCore.Shared.Items[item.name and item.name:lower() or ""]
                    -- print("Processing glovebox item:", item.name, "Created:", item.created, "Decay:", itemDef and itemDef.decay or "none", "Initial Quality:", item.info and item.info.quality or "none")
                    if not item.name or type(item.name) ~= "string" then
                        -- print("DECAY ERROR: Invalid item name in glovebox =>", json.encode(item))
                        if item.info then
                            item.info.quality = 100
                        else
                            item.info = { quality = 100 }
                        end
                        -- print("Set glovebox item (invalid name):", item.name or "Unknown", "Final Quality:", item.info.quality)
                    else
                        if itemDef and itemDef.decay and itemDef.decay ~= 0 then
                            if not item.info or type(item.info) ~= "table" then
                                item.info = { quality = 100 }
                            end
                            local quality = ConvertQuality(item)
                            item.info.quality = quality
                            -- print("Set glovebox item (with decay):", item.name, "Final Quality:", item.info.quality)
                        else
                            if item.info and item.info.quality and type(item.info.quality) == "number" and item.info.quality >= 0 and item.info.quality <= 100 then
                                -- print("Preserved glovebox item quality:", item.name, "Final Quality:", item.info.quality)
                            else
                                if item.info then
                                    item.info.quality = 100
                                else
                                    item.info = { quality = 100 }
                                end
                                -- print("Set glovebox item (no decay, no valid quality):", item.name, "Final Quality:", item.info.quality)
                            end
                        end
                    end
                else
                    -- print("Skipped glovebox item (no created):", item.name or "Unknown")
                end
            end
            SaveOwnedGloveboxItems(id, GlobeBoxItems)
        elseif Trunks[id] then
            local trunkItems = GetOwnedVehicleItems(id)
            for k, item in pairs(trunkItems) do
                if item.created then
                    local itemDef = QBCore.Shared.Items[item.name and item.name:lower() or ""]
                    -- print("Processing trunk item:", item.name, "Created:", item.created, "Decay:", itemDef and itemDef.decay or "none", "Initial Quality:", item.info and item.info.quality or "none")
                    if not item.name or type(item.name) ~= "string" then
                        -- print("DECAY ERROR: Invalid item name in trunk =>", json.encode(item))
                        if item.info then
                            item.info.quality = 100
                        else
                            item.info = { quality = 100 }
                        end
                        -- print("Set trunk item (invalid name):", item.name or "Unknown", "Final Quality:", item.info.quality)
                    else
                        if itemDef and itemDef.decay and itemDef.decay ~= 0 then
                            if not item.info or type(item.info) ~= "table" then
                                item.info = { quality = 100 }
                            end
                            local quality = ConvertQuality(item)
                            item.info.quality = quality
                            -- print("Set trunk item (with decay):", item.name, "Final Quality:", item.info.quality)
                        else
                            if item.info and item.info.quality and type(item.info.quality) == "number" and item.info.quality >= 0 and item.info.quality <= 100 then
                                -- print("Preserved trunk item quality:", item.name, "Final Quality:", item.info.quality)
                            else
                                if item.info then
                                    item.info.quality = 100
                                else
                                    item.info = { quality = 100 }
                                end
                                -- print("Set trunk item (no decay, no valid quality):", item.name, "Final Quality:", item.info.quality)
                            end
                        end
                    end
                else
                    -- print("Skipped trunk item (no created):", item.name or "Unknown")
                end
            end
            SaveOwnedVehicleItems(id, trunkItems)
        elseif Stashes[id] then
            local stashItems = GetStashItems(id)
            for k, item in pairs(stashItems) do
                if item.created then
                    local itemDef = QBCore.Shared.Items[item.name and item.name:lower() or ""]
                    -- print("Processing stash item:", item.name, "Created:", item.created, "Decay:", itemDef and itemDef.decay or "none", "Initial Quality:", item.info and item.info.quality or "none")
                    if not item.name or type(item.name) ~= "string" then
                        -- print("DECAY ERROR: Invalid item name in stash =>", json.encode(item))
                        if item.info then
                            item.info.quality = 100
                        else
                            item.info = { quality = 100 }
                        end
                        -- print("Set stash item (invalid name):", item.name or "Unknown", "Final Quality:", item.info.quality)
                    else
                        if itemDef and itemDef.decay and itemDef.decay ~= 0 then
                            if not item.info or type(item.info) ~= "table" then
                                item.info = { quality = 100 }
                            end
                            local quality = ConvertQuality(item)
                            item.info.quality = quality
                            -- print("Set stash item (with decay):", item.name, "Final Quality:", item.info.quality)
                        else
                            if item.info and item.info.quality and type(item.info.quality) == "number" and item.info.quality >= 0 and item.info.quality <= 100 then
                                -- print("Preserved stash item quality:", item.name, "Final Quality:", item.info.quality)
                            else
                                if item.info then
                                    item.info.quality = 100
                                else
                                    item.info = { quality = 100 }
                                end
                                -- print("Set stash item (no decay, no valid quality):", item.name, "Final Quality:", item.info.quality)
                            end
                        end
                    end
                else
                    -- print("Skipped stash item (no created):", item.name or "Unknown")
                end
            end
            SaveStashItems(id, stashItems)
        end
    end

    TriggerClientEvent("inventory:client:UpdatePlayerInventory", Player.PlayerData.source, false)
    data.inventory = inventory
    data.other = other
    cb(data)
end)
