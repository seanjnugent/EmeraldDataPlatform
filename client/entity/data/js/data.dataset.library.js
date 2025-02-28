/*******************************************************************************
Custom JS application specific
*******************************************************************************/
//#region Namespaces
app.data = app.data || {};

app.data.dataset = {};
app.data.dataset.ajax = {};
app.data.dataset.callback = {};
app.data.dataset.variables = {};
app.data.dataset.format = {};
app.data.dataset.format.response = {};
app.data.dataset.metadata = {};
app.data.dataset.metadata.response = null;
app.data.dataset.metadata.jsonStat = null;
app.data.dataset.metadata.timeDimensionCode = null;

app.data.dataset.saveQuery = {};
app.data.dataset.saveQuery.validation = {};
app.data.dataset.saveQuery.ajax = {};
app.data.dataset.saveQuery.callback = {};

//#endregion
app.data.dataset.draw = function () {
    $("#navigation-favourite-tables").collapse("hide");
    app.data.dataset.ajax.readformat();
    app.data.dataset.ajax.readMetadata();
}

app.data.dataset.ajax.readformat = function () {
    if ($.isEmptyObject(app.data.dataset.format.response)) {
        api.ajax.jsonrpc.request(
            app.config.url.api.jsonrpc.public,
            "PxStat.System.Settings.Format_API.Read",
            {
                "LngIsoCode": app.data.LngIsoCode,
                "FrmDirection": C_APP_TS_FORMAT_DIRECTION_DOWNLOAD
            },
            "app.data.dataset.callback.readformat"
        );
    }
}

app.data.dataset.callback.readformat = function (result) {
    if (result && Array.isArray(result) && result.length) {
        // Store for later use
        app.data.dataset.format.response = result;
    }
    // Handle exception
    else api.modal.exception(app.label.static["api-ajax-exception"]);
}

/**
* 
*/
app.data.dataset.ajax.readMetadata = function () {
    if (app.data.isLive) {
        api.ajax.jsonrpc.request(
            app.config.url.api.jsonrpc.public,
            "PxStat.Data.Cube_API.ReadMetadata",
            {
                "matrix": app.data.MtrCode,
                "format": {
                    "type": C_APP_FORMAT_TYPE_DEFAULT,
                    "version": C_APP_FORMAT_VERSION_DEFAULT
                },
                "language": app.data.LngIsoCode,
                "m2m": false
            },
            "app.data.dataset.callback.readMetadata",
            null,
            null,
            null,
            { async: false });
    }
    else {
        api.ajax.jsonrpc.request(app.config.url.api.jsonrpc.private,
            "PxStat.Data.Cube_API.ReadPreMetadata",
            {
                "release": app.data.RlsCode,
                "format": {
                    "type": C_APP_FORMAT_TYPE_DEFAULT,
                    "version": C_APP_FORMAT_VERSION_DEFAULT
                },
                "language": app.data.LngIsoCode,
                "m2m": false
            },
            "app.data.dataset.callback.readMetadata",
            null,
            null,
            null,
            { async: false });
    }
};

/**
* 
* @param {*} response
*/
app.data.dataset.callback.readMetadata = function (response) {
    //emergency fix for issue where map from previous table is displayed instead of the current table
    //this issue is fixed by a different means in dev 4.0.0
    $("#data-dataset-map-nav-content, #data-dataset-chart-nav-content").empty();
    app.data.dataset.metadata.response = response;
    app.data.dataset.metadata.jsonStat = response ? JSONstat(response) : null;
    $.each(app.data.dataset.metadata.jsonStat.Dimension(), function (index, value) {
        if (value.role == "time") {
            app.data.dataset.metadata.timeDimensionCode = app.data.dataset.metadata.jsonStat.id[index];
            return;
        }
    });

    if (app.data.dataset.metadata.jsonStat && app.data.dataset.metadata.jsonStat.length) {
        //put all dimension variables into object for future use
        app.data.dataset.variables = {};
        var dimensions = app.data.dataset.metadata.jsonStat.Dimension();
        $.each(dimensions, function (index, value) {
            app.data.dataset.variables[app.data.dataset.metadata.jsonStat.id[index]] = {};

            $.each(value.id, function (variableIndex, variable) {
                app.data.dataset.variables[app.data.dataset.metadata.jsonStat.id[index]][variable] = value.Category(variableIndex).label;
            });
        });

        if (app.data.isLive && !app.data.RlsCode) {
            app.navigation.setBreadcrumb([
                [app.data.dataset.metadata.jsonStat.extension.subject.value],
                [app.data.dataset.metadata.jsonStat.extension.product.value, "entity/data/", "#nav-link-data", null, { "PrcCode": app.data.dataset.metadata.jsonStat.extension.product.code }, app.config.url.application + C_COOKIE_LINK_PRODUCT + "/" + app.data.dataset.metadata.jsonStat.extension.product.code],
                [app.data.dataset.metadata.jsonStat.extension.matrix + " - " + app.data.dataset.metadata.jsonStat.label, "entity/data/", "#nav-link-data", null, { "MtrCode": app.data.dataset.metadata.jsonStat.extension.matrix }, app.config.url.application + C_COOKIE_LINK_TABLE + "/" + app.data.dataset.metadata.jsonStat.extension.matrix]
            ]);
        };
        app.navigation.setMetaDescription(app.library.html.parseDynamicLabel("meta-description-table",
            [
                app.data.dataset.metadata.jsonStat.extension.matrix,
                app.data.dataset.metadata.jsonStat.label,
                app.data.dataset.metadata.jsonStat.extension.copyright.name,
                moment(app.data.dataset.metadata.jsonStat.updated).format(app.config.mask.datetime.display)
            ]));
        app.navigation.setTitle(app.data.dataset.metadata.jsonStat.extension.matrix + " - " + app.data.dataset.metadata.jsonStat.label);
        app.data.dataset.callback.drawDatasetHeading();

        if (app.data.isModal) {
            $("#data-dataset-selected-table").find("[name=save-table]").hide();
            $("#data-dataset-selected-table").find("[name=remove-table]").hide();
            $('#data-view-modal').modal('show');
        } else {
            app.data.dataset.callback.readMatrixNotes();
        }

        //empty any previous datasets that were shown earlier
        $("#data-dataset-table-nav-content, #data-dataset-chart-nav-content, #data-dataset-map-nav-content").empty();
        $("#data-dataset-table-nav-tab, #data-dataset-chart-nav-tab, #data-dataset-map-nav-tab").removeClass("show").removeClass("active");
        $("#data-dataset-table-nav-content, #data-dataset-chart-nav-content, #data-dataset-map-nav-content").removeClass("show").removeClass("active");

        //chart tab
        if (app.config.entity.data.chartJs.chart.enabled) {
            $("#data-dataset-chart-nav-tab").show();
        }
        else {
            $("#data-dataset-chart-nav-tab").hide();
            $("#data-dataset-chart-nav-content").empty()
        }

        //map tab
        if (app.data.dataset.metadata.jsonStat.role.geo && app.config.entity.data.chartJs.map.enabled) {
            $("#data-dataset-map-nav-tab").show();
        }
        else {
            $("#data-dataset-map-nav-tab").hide();
            $("#data-dataset-map-nav-content").empty()
        }

        // Set the Tab based on their visibility and GoTo
        if (app.data.goTo[C_APP_GOTO_PARAMS] && app.data.goTo[C_APP_GOTO_PARAMS].tab && $("#" + app.data.goTo[C_APP_GOTO_PARAMS].tab).is(':visible')) {
            $("#" + app.data.goTo[C_APP_GOTO_PARAMS].tab).tab('show');
        } else {

            $("#data-dataset-table-nav-tab").tab('show');
        }
    }
    else {
        api.modal.exception(app.label.static["api-ajax-exception"]);
    }
};

app.data.dataset.callback.drawDatasetHeading = function () {
    // Local alias
    var data = app.data.dataset.metadata.jsonStat;

    //hide no search results message
    $("#data-search-row-desktop [name=no-search-results], #data-search-row-responsive [name=no-search-results]").hide();
    $("#data-search-row-desktop [name=search-input], #data-search-row-responsive [name=search-input]").val("");

    //hide back button if viewing data from release entity
    if (app.data.RlsCode) {
        $("#data-dataset-row").find("[name=back-to-select-results]").hide();
    };

    //$("button [name=button-show-data-text]").text(app.label.static["view-all"]);
    var matrixSelectionHeading = $("#data-dataset-templates").find("[name=matrix-selection-header]").clone();
    matrixSelectionHeading.find("[name=mtr-title]").text(data.label);
    matrixSelectionHeading.find("[name=mtr-code]").text(data.extension.matrix);

    app.library.utility.asyncController("app.navigation.user.savedTables", app.data.dataset.callback.drawFavouriteButtons, data)

    //update date
    if (!data.updated || data.updated == C_APP_DATETIME_DEFAULT) {
        matrixSelectionHeading.find("[name=updated-date-and-time]").addClass("d-none");
    }
    else {
        matrixSelectionHeading.find("[name=updated-date]").text(data.updated ? moment(data.updated, app.config.mask.datetime.ajax).format(app.config.mask.date.display) : "");
        matrixSelectionHeading.find("[name=updated-time]").text(data.updated ? moment(data.updated, app.config.mask.datetime.ajax).format(app.config.mask.time.display) : "");
    }
    // exceptional flag
    if (data.extension.exceptional) {
        matrixSelectionHeading.find("[name=exceptional-flag]").removeClass("d-none");
    }
    //geo flag
    if (data.role.geo) {
        matrixSelectionHeading.find("[name=geo-flag]").removeClass("d-none");
        matrixSelectionHeading.find("[name=map-header]").removeClass("d-none");
    }
    //official flag
    if (data.extension.official) {
        matrixSelectionHeading.find("[name=official-flag]").removeClass("d-none");
    }
    //analytical flag
    if (data.extension.analytical) {
        //check config to see how to handle analytical flag
        if (app.config.dataset.analytical.display) {
            matrixSelectionHeading.find("[name=analytical-flag]").removeClass("d-none").addClass(app.config.dataset.analytical.icon).addClass(app.config.dataset.analytical.colour);
            matrixSelectionHeading.find("[name=analytical-flag]").attr("label-tooltip", app.config.dataset.analytical.label);
        }
    }
    //archive flag
    if (data.extension.archive) {
        matrixSelectionHeading.find("[name=archive-flag]").removeClass("d-none");
        //show header
        matrixSelectionHeading.find("[name=archive-header]").show().addClass("d-flex justify-content-between align-items-center");

        //show more info link if exists
        if (app.config.entity.data.properties.archive) {
            matrixSelectionHeading.find("[name=archive-header]").find("[name=more-info]").show();
            matrixSelectionHeading.find("[name=archive-header]").find("[name=more-info-link]").attr("href", app.config.entity.data.properties.archive);
        }
    }

    //experimental flag
    if (data.extension.experimental) {
        matrixSelectionHeading.find("[name=experimental-flag]").removeClass("d-none");
        //show header
        matrixSelectionHeading.find("[name=experimental-header]").show().addClass("d-flex justify-content-between align-items-center");

        //show more info link if exists
        if (app.config.entity.data.properties.experimental) {
            matrixSelectionHeading.find("[name=experimental-header]").find("[name=more-info]").show();
            matrixSelectionHeading.find("[name=experimental-header]").find("[name=more-info-link]").attr("href", app.config.entity.data.properties.experimental);
        }
    }
    //reservation flag
    if (data.extension.reservation) {
        matrixSelectionHeading.find("[name=reservation-flag]").removeClass("d-none");

        //show header
        matrixSelectionHeading.find("[name=under-reservation-header]").show().addClass("d-flex justify-content-between align-items-center");

        //show more info link if exists
        if (app.config.entity.data.properties.underReservation) {
            matrixSelectionHeading.find("[name=under-reservation-header]").find("[name=more-info]").show();
            matrixSelectionHeading.find("[name=under-reservation-header]").find("[name=more-info-link]").attr("href", app.config.entity.data.properties.underReservation);
        }
    }
    if (app.config.entity.data.display.language) {
        //Add badge for language.
        matrixSelectionHeading.find("[name=language]").text(data.extension.language.name);
        matrixSelectionHeading.find("[name=language-wrapper]").show();
    }

    //dimension pill
    for (i = 0; i < data.length; i++) {
        if (data.Dimension(i).role == "classification" || data.Dimension(i).role == "geo") {
            var dimension = $("#data-dataset-templates").find("[name=dimension]").clone();
            dimension.text(data.Dimension(i).label);
            matrixSelectionHeading.find("[name=dimensions]").append(dimension);
        }
    }

    for (i = 0; i < data.length; i++) {
        if (data.Dimension(i).role == "time") {
            //frequency pill
            var frequency = $("#data-dataset-templates").find("[name=frequency]").clone();
            frequency.text(data.Dimension(i).label);
            matrixSelectionHeading.find("[name=dimensions]").append(frequency);

            //frequency span
            var frequencySpan = $("#data-dataset-templates").find("[name=frequency-span]").clone();
            frequencySpan.text(function () {
                if (data.Dimension(i).id.length > 1) {
                    return data.Dimension(i).Category(0).label + " - " + data.Dimension(i).Category(data.Dimension(i).length - 1).label;
                }
                else {
                    return data.Dimension(i).Category(0).label
                }
            });
            matrixSelectionHeading.find("[name=dimensions]").append(frequencySpan);
        }
    }

    //copyright
    if (app.config.entity.data.display.copyright) {
        matrixSelectionHeading.find("[name=copyright]").html(
            $("<i>", {
                class: "far fa-copyright me-1"
            }).get(0).outerHTML + data.extension.copyright.name
        ).attr("href", data.extension.copyright.href);
        matrixSelectionHeading.find("[name=copyright-wrapper]").show();
    }

    $("#data-dataset-selected-table [name=card-header]").html(matrixSelectionHeading);

    $("#data-dataset-row").show();
    //run bootstrap toggle to show/hide toggle button
    app.library.bootstrap.getBreakPoint();

    $("#data-dataset-selected-table").find("[name=save-table]").once("click", function () {
        //check that we have a user to save the table against
        if (app.navigation.user.isWindowsAccess || app.navigation.user.isLoginAccess || app.navigation.user.isSubscriberAccess) {
            app.data.dataset.ajax.saveTable(data.extension.matrix);
        }
        else {
            $("#modal-subscriber-login").modal("show");
        }

    });

    $("#data-dataset-selected-table").find("[name=remove-table]").once("click", function () {
        app.data.dataset.ajax.deleteTable(data.extension.matrix);
    });
};

app.data.dataset.callback.drawFavouriteButtons = function (data) {
    //check if matrix is one of the users saved tables
    var savedTable = $.grep(app.navigation.user.savedTables, function (value, index) {
        return value.RsbTable == data.extension.matrix;
    });

    if (savedTable.length) {
        $("#data-dataset-selected-table").find("[name=save-table]").hide();
        $("#data-dataset-selected-table").find("[name=remove-table]").show();
    }
    else {
        $("#data-dataset-selected-table").find("[name=remove-table]").hide();
        $("#data-dataset-selected-table").find("[name=save-table]").show();
    }
};

/**
* Callback Read Matrix Notes
*/
app.data.dataset.callback.readMatrixNotes = function () {
    // Local alias
    var data = app.data.dataset.metadata.jsonStat;

    var matrixNotes = $("#data-dataset-templates").find("[name=matrix-notes]").clone();
    matrixNotes.find("[name=full-download-card]").find(".card-header a").attr("href", "#data-dataset-selected-table-download-collapse").attr("aria-controls", "#data-dataset-selected-table-download-collapse");;
    matrixNotes.find("[name=full-download-card]").find(".collapse").attr("id", "data-dataset-selected-table-download-collapse");

    //notes
    if (data.note) {

        matrixNotes.find("[name=notes]").find(".card-header a").attr("href", "#data-dataset-selected-table-notes-collapse").attr("aria-controls", "#data-dataset-selected-table-notes-collapse");
        matrixNotes.find("[name=notes]").find(".collapse").attr("id", "data-dataset-selected-table-notes-collapse");

        $.each(data.note, function (index, value) {
            if (value) {
                matrixNotes.find("[name=notes]").find(".card-body").append(
                    $("<p>", {
                        html: app.library.html.parseBbCode(value)
                    }).get(0).outerHTML
                );
            }

        });
        if (!matrixNotes.find("[name=notes]").find(".card-body").is(":empty")) {
            matrixNotes.find("[name=notes]").show();
        }
    }

    //reasons
    if (data.extension.reasons && data.extension.reasons.length) {
        var reasons = data.extension.reasons;
        $.each(reasons, function (index, value) {
            var reason = $("#data-dataset-templates").find("[name=reason]").clone();
            reason.html(app.library.html.parseBbCode(value));
            matrixNotes.find("[name=reasons]").find(".card-body").find(".list-group").append(reason);
        });

        matrixNotes.find("[name=reasons]").find(".card-header a").attr("href", "#data-dataset-selected-table-reasons-collapse").attr("aria-controls", "#data-dataset-selected-table-reasons-collapse");
        matrixNotes.find("[name=reasons]").find(".collapse").attr("id", "data-dataset-selected-table-reasons-collapse");
        matrixNotes.find("[name=reasons]").show();
    }

    //contact name
    if (data.extension.contact.name) {
        matrixNotes.find("[name=contact-name]").text(data.extension.contact.name);
    }
    else {
        matrixNotes.find("[name=contact-name-row]").remove();
    }

    //contact email
    if (data.extension.contact.email) {

        matrixNotes.find("[name=contact-email]").html(app.library.html.email(data.extension.contact.email));
    }
    else {
        matrixNotes.find("[name=contact-email-row]").remove();
    }

    //contact phone
    if (data.extension.contact.phone) {
        matrixNotes.find("[name=contact-phone]").text(data.extension.contact.phone);
    }
    else {
        matrixNotes.find("[name=contact-phone-row]").remove();
    };

    $("#panel").html(matrixNotes.get(0).outerHTML);
    //run bootstrap toggle to show/hide toggle button
    app.library.bootstrap.getBreakPoint();

    // Run Sharethis.
    app.data.share(data.extension.matrix, null);
    app.data.dataset.ajax.format();


    $('#data-dataset-selected-table-download-collapse, #data-dataset-selected-table-notes-collapse, #data-dataset-selected-table-reasons-collapse').on('show.bs.collapse', function (e) {
        $(this).parent().find(".card-header").find("i").removeClass().addClass("fas fa-minus-circle");
    });

    $('#data-dataset-selected-table-download-collapse, #data-dataset-selected-table-notes-collapse, #data-dataset-selected-table-reasons-collapse').on('hide.bs.collapse', function (e) {
        $(this).parent().find(".card-header").find("i").removeClass().addClass("fas fa-plus-circle");
    });
};

app.data.dataset.ajax.format = function () {
    api.ajax.jsonrpc.request(
        app.config.url.api.jsonrpc.public,
        "PxStat.System.Settings.Format_API.Read",
        {
            "FrmDirection": C_APP_TS_FORMAT_DIRECTION_DOWNLOAD
        },
        "app.data.dataset.callback.format"
    );
}

app.data.dataset.callback.format = function (data) {
    if (data && Array.isArray(data) && data.length) {
        $("#panel [name=download-full-dataset]").empty();
        $.each(data, function (index, format) {
            var formatLink = $("#data-dataset-templates").find("[name=download-dataset-format]").clone();
            formatLink.attr(
                {
                    "frm-type": format.FrmType,
                    "frm-version": format.FrmVersion
                });

            formatLink.attr("href", C_APP_API_RESTFUL_READ_DATASET_URL.sprintf([app.config.url.api.restful + "/",
            encodeURI(app.data.MtrCode),
            format.FrmType,
            format.FrmVersion,
                ""]));

            formatLink.find("[name=type]").text(format.FrmType);
            formatLink.find("[name=version]").text(format.FrmVersion);
            $("#panel [name=download-full-dataset]").append(formatLink);
        });

        $("#panel [name=download-dataset-format]").once("click", function (e) {
            e.preventDefault();
            app.data.dataset.callback.fullDownload($(this).attr("frm-type"), $(this).attr("frm-version"));
        });
    }
    // Handle no data
    else api.modal.information(app.label.static["api-ajax-nodata"]);
}


app.data.dataset.callback.fullDownload = function (format, version) {
    var apiParams = {
        "class": C_APP_JSONSTAT_QUERY_CLASS,
        "id": [],
        "dimension": {},
        "extension": {
            "matrix": app.data.MtrCode,
            "codes": true,
            "pivot": null,
            "language": {
                "code": app.data.LngIsoCode
            },
            "format": {
                "type": format,
                "version": version
            }
        },
        "version": C_APP_JSONSTAT_QUERY_VERSION,
        "m2m": false
    };

    app.data.dataset.ajax.downloadDataset(apiParams, app.data.dataset.table.totalCount);
}

app.data.dataset.ajax.downloadDataset = function (apiParams, dataCellCount) {
    switch (apiParams.extension.format.type) {
        case C_APP_TS_FORMAT_TYPE_CSV:
            if (dataCellCount > app.config.dataset.download.threshold.csv) {
                api.modal.information(app.library.html.parseDynamicLabel("download-threshold-exceeded", [app.library.utility.formatNumber(dataCellCount), apiParams.extension.format.type, app.library.utility.formatNumber(app.config.dataset.download.threshold.csv)]));
                return
            }
            break;
        case C_APP_TS_FORMAT_TYPE_XLSX:
            if (dataCellCount > app.config.dataset.download.threshold.xlsx) {
                api.modal.information(app.library.html.parseDynamicLabel("download-threshold-exceeded", [app.library.utility.formatNumber(dataCellCount), apiParams.extension.format.type, app.library.utility.formatNumber(app.config.dataset.download.threshold.xlsx)]));
                return
            }
            break;
        default:
            break;
    }
    if (app.data.isLive) {
        api.ajax.jsonrpc.request(
            app.config.url.api.jsonrpc.public,
            "PxStat.Data.Cube_API.ReadDataset",
            apiParams,
            "app.data.dataset.callback.downloadDataset",
            apiParams,
            null,
            null,
            {
                async: false,
                timeout: app.config.transfer.timeout
            });
    }
    else {
        api.ajax.jsonrpc.request(
            app.config.url.api.jsonrpc.private,
            "PxStat.Data.Cube_API.ReadPreDataset",
            apiParams,
            "app.data.dataset.callback.downloadDataset",
            apiParams,
            null,
            null,
            {
                async: false,
                timeout: app.config.transfer.timeout
            });
    }
};

/**
* 
* @param {*} data
* @param {*} apiParams
*/
app.data.dataset.callback.downloadDataset = function (data, apiParams) {
    var fileName = app.data.fileNamePrefix + '.' + moment(Date.now()).format(app.config.mask.datetime.file);

    switch (apiParams.extension.format.type) {
        case C_APP_TS_FORMAT_TYPE_PX:
            // Download the file
            app.library.utility.download(fileName, data, C_APP_EXTENSION_PX, C_APP_MIMETYPE_PX);
            break;
        case C_APP_TS_FORMAT_TYPE_JSONSTAT:
            // Download the file
            app.library.utility.download(fileName, JSON.stringify(data), C_APP_EXTENSION_JSON, C_APP_MIMETYPE_JSON);
            break;
        case C_APP_TS_FORMAT_TYPE_CSV:
            // Download the file
            app.library.utility.download(fileName, data, C_APP_EXTENSION_CSV, C_APP_MIMETYPE_CSV);
            break;
        case C_APP_TS_FORMAT_TYPE_XLSX:
            // Download the file
            app.library.utility.download(fileName, data, C_APP_EXTENSION_XLSX, null, true);
            break;
        default:
            api.modal.exception(app.label.static["api-ajax-exception"]);
            break;
    }
};


app.data.dataset.callback.back = function () {
    //always remove last breadcrumb
    $("#breadcrumb-nav").find(".breadcrumb-item").last().remove();
    if (app.data.isSearch) {
        //remove product and subject  also
        $("#breadcrumb-nav").find(".breadcrumb-item").last().remove();
        $("#breadcrumb-nav").find(".breadcrumb-item").last().remove();
    }

    if (app.data.PrdCode) {
        app.data.share(null, app.data.PrdCode);
        //reload breadcrumb
        app.data.searchResult.ajax.getBreadcrumb();
    }
    //first check if we have search results to display
    var numSearchResults = $("#data-search-row-desktop [name=search-results] [name=search-result-item]").length;
    if (numSearchResults > 0) {
        //back to search results
        $("#data-dataset-selected-table [name=card-header], #panel, #data-view-container").empty();
        $("#data-search-row-desktop [name=search-results], #data-filter, #data-search-result-pagination [name=pagination], #data-search-result-pagination [name=pagination-toggle]").show();
        $("#data-accordion-api").hide();
        //run bootstrap toggle to show/hide toggle button
        app.library.bootstrap.getBreakPoint();
        $('html, body').animate({
            scrollTop: $("[name=search-results]").parent().offset().top
        }, 1000);
    }
    else {
        // Load default Entity
        api.content.goTo("entity/data/", "#nav-link-data");
    }
    $("#data-dataset-row").find("[name=back-to-select-results]").hide();
    $("#data-dataset-row").hide();

};

//#region save a table
app.data.dataset.ajax.saveTable = function (matrix) {
    if (app.navigation.user.isWindowsAccess || app.navigation.user.isLoginAccess) {
        api.ajax.jsonrpc.request(
            app.config.url.api.jsonrpc.private,
            "PxStat.Subscription.Subscription_API.TableSubscriptionCreate",
            {
                "TsbTable": matrix
            },
            "app.data.dataset.callback.saveTable",
            matrix
        );
    }
    else if (app.navigation.user.isSubscriberAccess) {
        app.auth.firebase.user.details.getIdToken(true).then(function (accessToken) {
            api.ajax.jsonrpc.request(
                app.config.url.api.jsonrpc.private,
                "PxStat.Subscription.Subscription_API.TableSubscriptionCreate",
                {
                    "TsbTable": matrix,
                    "Uid": app.auth.firebase.user.details.uid,
                    "AccessToken": accessToken
                },
                "app.data.dataset.callback.saveTable",
                matrix
            );
        }).catch(tokenerror => {
            api.modal.error(tokenerror);
        });
    }
};

app.data.dataset.callback.saveTable = function (data, matrix) {
    if (data == C_API_AJAX_SUCCESS) {
        $("#data-dataset-selected-table").find("[name=save-table]").hide();
        $("#data-dataset-selected-table").find("[name=remove-table]").show();
        app.navigation.user.ajax.getSavedTables();
    } else {
        api.modal.exception(app.label.static["api-ajax-exception"]);
    }
};

app.data.dataset.ajax.deleteTable = function (matrix) {
    if (app.navigation.user.isWindowsAccess || app.navigation.user.isLoginAccess) {
        api.ajax.jsonrpc.request(
            app.config.url.api.jsonrpc.private,
            "PxStat.Subscription.Subscription_API.TableSubscriptionDelete",
            {
                "TsbTable": matrix
            },
            "app.data.dataset.callback.deleteTable",
            matrix
        );
    }
    else if (app.navigation.user.isSubscriberAccess) {
        app.auth.firebase.user.details.getIdToken(true).then(function (accessToken) {
            api.ajax.jsonrpc.request(
                app.config.url.api.jsonrpc.private,
                "PxStat.Subscription.Subscription_API.TableSubscriptionDelete",
                {
                    "TsbTable": matrix,
                    "Uid": app.auth.firebase.user.details.uid,
                    "AccessToken": accessToken
                },
                "app.data.dataset.callback.deleteTable",
                matrix
            );
        }).catch(tokenerror => {
            api.modal.error(tokenerror);
        });
    }
};

app.data.dataset.callback.deleteTable = function (data, matrix) {
    if (data == C_API_AJAX_SUCCESS) {
        $("#data-dataset-selected-table").find("[name=save-table]").show();
        $("#data-dataset-selected-table").find("[name=remove-table]").hide();
        app.navigation.user.ajax.getSavedTables();
    } else {
        api.modal.exception(app.label.static["api-ajax-exception"]);
    }
};
//#endregion

//#region save query
app.data.dataset.saveQuery.validation.drawSaveQuery = function () {

    $('#data-dataset-save-query [name=fluid-time]').bootstrapToggle("destroy").bootstrapToggle({
        onlabel: app.label.static["true"],
        offlabel: app.label.static["false"],
        onstyle: "primary",
        offstyle: "warning text-dark",
        height: 38,
        width: C_APP_TOGGLE_LENGTH
    }).bootstrapToggle('on');

    $("#data-dataset-save-query form").trigger("reset").validate({
        rules: {
            "name":
            {
                required: true
            }
        },
        errorPlacement: function (error, element) {
            $("#data-dataset-save-query [name=" + element[0].name + "-error-holder]").append(error[0]);
        },
        submitHandler: function (form) {
            $(form).sanitiseForm();
            switch ($("#data-dataset-selected-table").find("[name=table-selection-card] .nav-tabs").find(".nav-item.active").attr("id")) {
                case "data-dataset-table-nav-tab":
                    app.data.dataset.table.saveQuery.ajax.saveQuery();
                    break;
                case "data-dataset-chart-nav-tab":
                    app.data.dataset.chart.saveQuery.ajax.saveQuery();
                    break;
                case "data-dataset-map-nav-tab":
                    app.data.dataset.map.saveQuery.ajax.saveQuery();
                    break;
                default:
                    break;
            }
        }
    }).resetForm();

};
//#endregion