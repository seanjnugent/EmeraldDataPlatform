/*******************************************************************************
Custom JS application specific
*******************************************************************************/
//#region Create Namespace
// Create Namespace
app.keyword = {};
app.keyword.release = {};
app.keyword.release.modal = {};
app.keyword.release.validation = {};
app.keyword.release.ajax = {};
app.keyword.release.callback = {};
app.keyword.release.display = {};
app.keyword.release.RlsCode = null;
app.keyword.release.isLive = null;

//#endregion

//#region Functions keyword.release.

/**
 * Map data for select2 dropdown
 * @param  {} dataAPI
 */
app.keyword.release.mapDataMatrix = function (dataAPI) {
    $.each(dataAPI, function (i, item) {
        // Create ID and NAME to the list
        dataAPI[i].id = item.MtrCode;
        dataAPI[i].text = item.MtrCode;
    });
    return dataAPI;
};

//#endregion

//#region Create keyword.release.

/**
 * Show modal to Create release-keyword
 */
app.keyword.release.modal.create = function () {
    //Validation on Create
    app.keyword.release.validation.create();
    app.keyword.release.ajax.getLanguagesCreate();
    $("#keyword-release-modal-create").find("[name=language-row]").show()

    $("#keyword-release-modal-create").find("[name=acronym-toggle]").bootstrapToggle('off');
    $("#keyword-release-modal-create").find("[name=acronym-toggle]").once("change", function () {
        $("#keyword-release-modal-create").find("[name=language-row]").toggle()
    });

    $("#keyword-release-modal-create").modal("show");
};

/**
*  Get languages data from API to populate language drop down for create.
*/
app.keyword.release.ajax.getLanguagesCreate = function () {
    api.ajax.jsonrpc.request(app.config.url.api.jsonrpc.public,
        "PxStat.System.Settings.Language_API.Read",
        { LngIsoCode: null },
        "app.keyword.release.callback.getLanguagesCreate");
};

/**
*  Populate language drop down for create.
*/
app.keyword.release.callback.getLanguagesCreate = function (data) {
    $("#keyword-release-modal-create").find("[name=language]").empty().append($("<option>", {
        "text": app.label.static["select-uppercase"],
        "disabled": "disabled",
        "selected": "selected"
    }));
    $.each(data, function (key, value) {
        var attributes = {
            "value": value.LngIsoCode,
            "text": value.LngIsoName
        };

        $("#keyword-release-modal-create").find("[name=language]").append($("<option>", attributes));
    });
}

/**
 * Ajax call create  keyword.release
 */
app.keyword.release.ajax.create = function () {
    var selectedReleaseCode = $("#keyword-release-modal-create").find("[name='rls-code']").val();
    var krlValue = $("#keyword-release-modal-create").find("[name=krl-value]").val();
    var apiParams = {
        KrlValue: krlValue,
        RlsCode: selectedReleaseCode,
        LngIsoCode: $("#keyword-release-modal-create [name=acronym-toggle]").is(':checked') ? null : $("#keyword-release-modal-create [name=language]").val()
    };

    var callbackParam = {
        KrlValue: krlValue,
        RlsCode: selectedReleaseCode,
        idn: selectedReleaseCode
    };
    // CAll Ajax to Create keyword.release. Do Redraw Data Table for Create keyword.release.
    api.ajax.jsonrpc.request(app.config.url.api.jsonrpc.private,
        "PxStat.System.Navigation.Keyword_Release_API.Create",
        apiParams,
        "app.keyword.release.callback.createOnSuccess",
        callbackParam,
        "app.keyword.release.callback.createOnError",
        null,
        { async: false }
    );
};

/**
 * 
 * * Create keyword.release to Table after Ajax success call
 * @param  {} data
 * @param  {} callbackParam
 */
app.keyword.release.callback.createOnSuccess = function (data, callbackParam) {
    $("#keyword-release-modal-create").modal("hide");
    app.keyword.release.ajax.read();

    if (data == C_API_AJAX_SUCCESS) {
        // Display Success Modal
        api.modal.success(app.library.html.parseDynamicLabel("success-record-added", [callbackParam.KrlValue]));
    } else {
        api.modal.exception(app.label.static["api-ajax-exception"]);
    }
};

/**
 * 
 * * Create keyword.release to Table after Ajax success call
 * @param  {} error
 */
app.keyword.release.callback.createOnError = function (error) {
    $("#keyword-release-modal-create").modal("hide");
    app.keyword.release.ajax.read();
};
//#endregion


//#region Read keyword.release.

/**
 * Update Drop Down Subject
  */
app.keyword.release.ajax.matrixReadList = function () {
    //Get a full list of Subject. Call the API to get Subject names 
    api.ajax.jsonrpc.request(
        app.config.url.api.jsonrpc.private,
        "PxStat.Data.Matrix_API.ReadCodeList",
        null,
        "app.keyword.release.callback.matrixReadList"
    );
};

/**
 * Callback matrix Read List
 * @param {*} data
 */
app.keyword.release.callback.matrixReadList = function (data) {
    // Load Select2
    $("#keyword-release-container").find("[name=keyword-release-matrix-search]").empty().append($("<option>")).select2({
        minimumInputLength: 0,
        allowClear: true,
        width: '100%',
        placeholder: app.label.static["start-typing"],
        data: app.keyword.release.mapDataMatrix(data)
    });

    $("#keyword-release-container").find("[name=keyword-release-matrix-search]").prop('disabled', false).focus();

    //Update Subject search Search functionality
    $("#keyword-release-container").find("[name=keyword-release-matrix-search]").on('select2:select', function (e) {
        var selectedMatrix = e.params.data;
        if (selectedMatrix) {
            // Some item from your model is active!
            if (selectedMatrix.id.toLowerCase() == $("#keyword-release-container").find("[name=keyword-release-matrix-search]").val().toLowerCase()) {
                app.keyword.release.ajax.readRelease(selectedMatrix.id);
                $("#keyword-release-table-release-container").show();
                $("#keyword-release-table-release-keyword-container").hide();
            }
            else {
                $("#keyword-release-table-release-container").hide();
                $("#keyword-release-table-release-keyword-container").hide();
            }
        } else {
            // Nothing is active so it is a new value (or maybe empty value)
            $("#keyword-release-table-release-container").hide();
            $("#keyword-release-table-release-keyword-container").hide();
        }
    });
};


//#region Read
/**
 * Read keyword subject ajax
 * @param {*} selectedMtrCode
 */
app.keyword.release.ajax.readRelease = function (selectedMtrCode) {
    api.ajax.jsonrpc.request(
        app.config.url.api.jsonrpc.private,
        "PxStat.Data.Release_API.ReadList",
        {
            "MtrCode": selectedMtrCode,
            LngIsoCode: app.label.language.iso.code
        },
        "app.keyword.release.callback.readReleaseList"
    );
};

/**
 * Callback read Release List
 * @param {*} data
 */
app.keyword.release.callback.readReleaseList = function (data) {
    app.keyword.release.drawDataTableRelease(data);
    $("#keyword-release-table-release-container").hide().fadeIn();
};

/**
 * Draw Callback for Datatable
 */
app.keyword.drawCallbackRelease = function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
    // Display  the modal "modal-update-reason" on click
    $("#keyword-release-table-release-container table").find("[name=" + C_APP_NAME_LINK_INTERNAL + "]").once("click", function (e) {
        e.preventDefault();
        var idn = $(this).attr("idn");
        var mtrCode = $(this).attr("mtr-code");
        var rlsVersion = $(this).attr("rls-version");
        var rlsRevision = $(this).attr("rls-revision");

        // Set namespace var
        app.keyword.release.RlsCode = idn;

        //set namespace app.keyword.release.isLive
        app.keyword.release.isLive = app.release.checkStatusLive(
            {
                "RlsLiveDatetimeFrom": $(this).attr("rls-datatime-from"),
                "RlsLiveDatetimeTo": $(this).attr("rls-datatime-to"),
                "RlsRevision": $(this).attr("rls-revision")
            }
        );

        //Set RlsCode for create new #keyword-release
        $("#keyword-release-modal-create").find("[name='rls-code']").val(idn);
        $("#keyword-release-modal-create").find("[name='mtr-code']").text(mtrCode);
        $("#keyword-release-modal-create").find("[name='rls-version']").text(rlsVersion);
        $("#keyword-release-modal-create").find("[name='rls-revision']").text(rlsRevision);


        $("#keyword-release-modal-update").find("[name='rls-code']").val(idn);
        $("#keyword-release-modal-update").find("[name='mtr-code']").text(mtrCode);
        $("#keyword-release-modal-update").find("[name='rls-version']").text(rlsVersion);
        $("#keyword-release-modal-update").find("[name='rls-revision']").text(rlsRevision);

        $("#keyword-release-table-release-keyword-container").find("[name=button-view]").attr('mtr-code', mtrCode);
        $("#keyword-release-table-release-keyword-container").find("[name=button-view]").attr('rls-code', idn); // Release ID (rlsCode).
        //Read  Keyword-Release by Release Code.
        app.keyword.release.ajax.read();
    });
}

/**
 * Create DataTable and get JASON data
 * @param {*} data 
 */
app.keyword.release.drawDataTableRelease = function (data) {
    if ($.fn.DataTable.isDataTable("#keyword-release-table-release-container table")) {
        app.library.datatable.reDraw("#keyword-release-table-release-container table", data);
    } else {

        var localOptions = {
            order: [[0, 'desc']],
            data: data,
            columns: [
                {
                    data: null,
                    render: function (data, type, row) {
                        var attributes = { idn: row.RlsCode, "rls-version": row.RlsVersion, "rls-revision": row.RlsRevision, "mtr-code": row.MtrCode, "lng-iso-code": row.LngIsoCode, "rls-datatime-from": row.RlsLiveDatetimeFrom, "rls-datatime-to": row.RlsLiveDatetimeTo }; //idn RlsCode
                        return app.library.html.link.internal(attributes, row.RlsVersion + "." + row.RlsRevision);
                    }
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        // FIXME: Import whole release.library.js - we might create shared version of methods at app.library.js
                        return app.release.renderStatus(row);
                    }
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        return app.release.renderRequest(row.RqsCode);
                    }
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        return row.RlsLiveDatetimeFrom ? moment(row.RlsLiveDatetimeFrom).format(app.config.mask.datetime.display) : "";
                    }
                },
                {
                    data: null,
                    render: function (data, type, row) {
                        return row.RlsLiveDatetimeTo ? moment(row.RlsLiveDatetimeTo).format(app.config.mask.datetime.display) : "";
                    }
                }
            ],
            drawCallback: function (settings) {
                app.keyword.drawCallbackRelease();
            },
            //Translate labels language
            language: app.label.plugin.datatable
        };
        $("#keyword-release-table-release-container table").DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            app.keyword.drawCallbackRelease();
        });
    }
};

/**
 * Read Release List Ajax
 */
app.keyword.release.ajax.read = function () {
    api.ajax.jsonrpc.request(
        app.config.url.api.jsonrpc.private,
        "PxStat.System.Navigation.Keyword_Release_API.Read",
        { RlsCode: app.keyword.release.RlsCode },
        "app.keyword.release.callback.read"
    );
};

/**
 * Callback function when the keyword-release Read call is successful.
 * @param {*} data
 */
app.keyword.release.callback.read = function (data) {
    app.keyword.release.drawDataTable(data);
    $("#keyword-release-table-release-keyword-container").hide().fadeIn();
    $('html, body').animate({
        scrollTop: $("#keyword-release-table-release-keyword-container").offset().top
    }, 1000);
};

/**
 * Draw Callback for Datatable
 */
app.keyword.drawCallbackKeyword = function () {
    $('[data-bs-toggle="tooltip"]').tooltip();
    // Display  the modal "modal-update-release-keyword" on "[name=" + C_APP_NAME_LINK_EDIT + "]" click
    $("#keyword-release-table-release-keyword-container table").find("[name=" + C_APP_NAME_LINK_EDIT + "]").once("click", function (e) {
        e.preventDefault();
        var idn = $(this).attr("idn"); //idn: KrlCode
        var mtrCode = $("#keyword-release-container").find("[name=keyword-release-matrix-search]").val();
        var apiParams = { KrlCode: idn, MtrCode: mtrCode };

        app.keyword.release.ajax.readUpdate(apiParams);
    });

    //Call Synonyms when word is selected.
    $("td.details-request-control i.fa.plus-control").css({ "color": "forestgreen" });
    $("#keyword-release-table-release-keyword-container table").find("[name=" + C_APP_DATATABLE_EXTRA_INFO_LINK + "]").once("click", function (e) {
        e.preventDefault();
        var idn = $(this).attr("idn");
        var rowIndexObj = $("[" + C_APP_DATATABLE_ROW_INDEX + "='" + idn + "']");
        var dataTable = $("#keyword-release-table-release-keyword-container table").DataTable();
        var dataTableRow = dataTable.row(rowIndexObj);
        app.keyword.release.ajax.synonym(dataTableRow.data());
        $("#keyword-release-extra-info").modal("show");
    });


    // Display confirmation Modal on DELETE button click "release-keyword"
    $("#keyword-release-table-release-keyword-container table").find("[name=" + C_APP_NAME_LINK_DELETE + "]").once("click", app.keyword.release.modal.delete);
}

/**
 * Create DataTable and get JASON data
 * @param {*} data 
 */
app.keyword.release.drawDataTable = function (data) {
    if ($.fn.DataTable.isDataTable("#keyword-release-table-release-keyword-container table")) {
        app.library.datatable.reDraw("#keyword-release-table-release-keyword-container table", data);
    } else {
        var localOptions = {
            // Add Row Index to feed the ExtraInfo modal 
            createdRow: function (row, dataRow, dataIndex) {
                $(row).attr(C_APP_DATATABLE_ROW_INDEX, dataIndex);
            },
            data: data,
            columns: [
                {
                    data: null,
                    render: function (data, type, row) {
                        if (row.KrlMandatoryFlag) {
                            return app.library.html.locked(row.KrlValue);
                        }
                        else {
                            var attributes = { idn: row.KrlCode, "krl-value": row.KrlValue }; //idn KrlCode
                            return app.library.html.link.edit(attributes, row.KrlValue);
                        }
                    }
                },
                {
                    data: null,
                    defaultContent: '',
                    sorting: false,
                    searchable: false,
                    "render": function (data, type, row, meta) {
                        return $("<a>", {
                            href: "#",
                            name: C_APP_DATATABLE_EXTRA_INFO_LINK,
                            "idn": meta.row,
                            html:
                                $("<i>", {
                                    "class": "fas fa-info-circle text-info"
                                }).get(0).outerHTML +
                                " " + app.label.static["details"]
                        }).get(0).outerHTML;
                    }
                },
                {
                    data: null,
                    type: "natural",
                    render: function (data, type, row) {
                        return app.library.html.boolean(row.KrlMandatoryFlag, true, true);
                    }
                },
                {
                    data: null,
                    type: "natural",
                    render: function (data, type, row) {
                        return app.library.html.boolean(!row.KrlSingularisedFlag, true, true);
                    }
                },
                {
                    data: null,
                    sorting: false,
                    searchable: false,
                    render: function (data, type, row) {
                        var attributes = { idn: row.KrlCode, "krl-value": row.KrlValue, "rls-code": row.RlsCode }; //idn KrlCode
                        if (row.KrlMandatoryFlag) {
                            return app.library.html.deleteButton(attributes, true);
                        }
                        return app.library.html.deleteButton(attributes, false);
                    },
                    "width": "1%"
                }
            ],
            drawCallback: function (settings) {
                app.keyword.drawCallbackKeyword();
            },
            //Translate labels language
            language: app.label.plugin.datatable
        };
        $("#keyword-release-table-release-keyword-container table").DataTable($.extend(true, {}, app.config.plugin.datatable, localOptions)).on('responsive-display', function (e, datatable, row, showHide, update) {
            app.keyword.drawCallbackKeyword();
        });

        //Create CLICK EVENT. Create release-keyword.
        $("#keyword-release-table-release-keyword-container").find("[name=button-create]").once("click", function (e) {
            app.keyword.release.modal.create();
        });
        // Display Data in modal (reuse code app.data.dataset)
        $("#keyword-release-table-release-keyword-container").find("[name=button-view]").once("click", function (e) {
            e.preventDefault();
            //Pass User SELECTED language. TODO: Change service required if release do not have this language return default system language "app.config.language.iso.code"
            //Server exception TODO: Retest after service update.
            app.data.init(
                app.label.language.iso.code,
                $(this).attr('mtr-code'),
                $(this).attr('rls-code'),
                $("#keyword-release-container").find("[name=keyword-release-matrix-search]").val(),
                true,
                app.keyword.release.isLive
            );
            app.data.dataset.draw();
        });
    }
};

//#endregion
//#region Update keyword.release.

/**
 * Ajax read
 * @param {*} apiParams
 */
app.keyword.release.ajax.readUpdate = function (apiParams) {
    api.ajax.jsonrpc.request(app.config.url.api.jsonrpc.private,
        "PxStat.System.Navigation.Keyword_Release_API.Read",
        apiParams,
        "app.keyword.release.callback.readKeyword");
};

/**
 * Populate keyword.release data to Update Modal
 * @param {*} data 
 */
app.keyword.release.callback.readKeyword = function (data) {
    if (data && Array.isArray(data) && data.length) {
        data = data[0];

        app.keyword.release.modal.update(data);
    } else {
        api.modal.information(app.label.static["api-ajax-nodata"]);
        // Force reload
        app.keyword.release.ajax.read();
    }
};

/**
 * Function to load Update Modal
 * @param {*} keywordRecord
 * 
 */
app.keyword.release.modal.update = function (keywordRecord) {
    // Validate Update keyword.release -and reset form
    app.keyword.release.validation.update();
    app.keyword.release.ajax.getLanguagesUpdate();
    //Populate values
    $("#keyword-release-modal-update").find("[name='krl-value']").val(keywordRecord.KrlValue);
    $("#keyword-release-modal-update").find("[name='krl-code']").val(keywordRecord.KrlCode);
    $("#keyword-release-modal-update").find("[name='rls-code']").val(keywordRecord.RlsCode);
    // Display  Modal

    if (keywordRecord.KrlSingularisedFlag) {
        $("#keyword-release-modal-update").find("[name=acronym-toggle]").bootstrapToggle('off');
        $("#keyword-release-modal-update").find("[name=language-row]").show();
    }
    else {
        $("#keyword-release-modal-update").find("[name=acronym-toggle]").bootstrapToggle('on');
        $("#keyword-release-modal-update").find("[name=language-row]").hide();
    };

    $("#keyword-release-modal-update").find("[name=acronym-toggle]").once("change", function () {
        $("#keyword-release-modal-update").find("[name=language-row]").toggle()
    });

    $("#keyword-release-modal-update").modal('show');
};

/**
*  Get languages data from API to populate language drop down for create.
*/
app.keyword.release.ajax.getLanguagesUpdate = function () {
    api.ajax.jsonrpc.request(app.config.url.api.jsonrpc.public,
        "PxStat.System.Settings.Language_API.Read",
        { LngIsoCode: null },
        "app.keyword.release.callback.getLanguagesUpdate");
};

/**
*  Populate language drop down for create.
*/
app.keyword.release.callback.getLanguagesUpdate = function (data) {
    $("#keyword-release-modal-update").find("[name=language]").empty().append($("<option>", {
        "text": app.label.static["select-uppercase"],
        "disabled": "disabled",
        "selected": "selected"
    }));
    $.each(data, function (key, value) {
        $("#keyword-release-modal-update").find("[name=language]").append($("<option>", {
            "value": value.LngIsoCode,
            "text": value.LngIsoName
        }));
    });
}

//#endregion
//#region Delete keyword.release.

//#region Delete
//Delete one row from keyword-release
app.keyword.release.modal.delete = function () {
    var idn = $(this).attr("idn"); //idn: KrlCode
    var krlValue = $(this).attr("krl-value");//row.KrlValue
    var rlsCode = $(this).attr("rls-code");//row.RlsCode
    var deletetedKeyword = {
        idn: idn, //idn: KrlCode
        KrlValue: krlValue,
        RlsCode: rlsCode
    };
    api.modal.confirm(app.library.html.parseDynamicLabel("confirm-delete", [deletetedKeyword.KrlValue]), app.keyword.release.ajax.delete, deletetedKeyword);
};

/**
 * AJAX call to Delete a specific entry 
 * On AJAX success delete (Do reload table)
 * @param {*} deletetedKeyword
 */
app.keyword.release.ajax.delete = function (deletetedKeyword) {
    // Get the indemnificator to delete
    var apiParams = { KrlCode: deletetedKeyword.idn }; // idn KrlCode value
    var callbackParam = {
        idn: deletetedKeyword.RlsCode, //idn: RlsCode
        RlsCode: deletetedKeyword.RlsCode,
        KrlValue: deletetedKeyword.KrlValue
    };
    // Call the API by passing the idn to delete keyword.release from DB
    api.ajax.jsonrpc.request(
        app.config.url.api.jsonrpc.private,
        "PxStat.System.Navigation.Keyword_Release_API.Delete",
        apiParams,
        "app.keyword.release.callback.deleteOnSuccess",
        callbackParam,
        "app.keyword.release.callback.deleteOnError",
        null,
        { async: false }
    );
};

/**
 * Callback from server for Delete keyword.release Keyword
 * @param {*} data
 * * @param {*} callbackParam
 */
app.keyword.release.callback.deleteOnSuccess = function (data, callbackParam) {
    //Redraw Data Table keyword.release with fresh data.
    app.keyword.release.ajax.read();

    if (data == C_API_AJAX_SUCCESS) {
        // Display Success Modal
        api.modal.success(app.library.html.parseDynamicLabel("success-record-deleted", [callbackParam.KrlValue]));
    }
    // Handle Exception
    else api.modal.exception(app.label.static["api-ajax-exception"]);
};

/**
 * Callback from server for Delete keyword.release Keyword
 * @param {*} error
 */
app.keyword.release.callback.deleteOnError = function (error) {
    //Redraw Data Table keyword.release with fresh data.
    app.keyword.release.ajax.read();
};
//#endregion


//#region Validation
/**
* Define validation for create
*/
app.keyword.release.validation.create = function () {
    $("#keyword-release-modal-create form").trigger("reset").onSanitiseForm().validate({
        onkeyup: function (element) {
            this.element(element);
        },
        rules: {
            "krl-value": {
                required: true,
                normalizer: function (value) {
                    value = value.sanitise(C_SANITISE_LOWERCASE, C_APP_REGEX_ALPHANUMERIC_DIACRITIC);
                    $(this).val(value);
                    return value;
                }
            },
            "language": {
                required: {
                    depends: function () {
                        return !$("#keyword-release-modal-create [name=acronym-toggle]").is(':checked');
                    }
                }
            }
        },
        errorPlacement: function (error, element) {
            $("#keyword-release-modal-create [name=" + element[0].name + "-error-holder").append(error[0]);
        },
        submitHandler: function (form) {
            $(form).sanitiseForm();
            app.keyword.release.ajax.create();
        }
    }).resetForm();
};

/**
* Define validation for update
*/
app.keyword.release.validation.update = function () {
    $("#keyword-release-modal-update form").trigger("reset").onSanitiseForm().validate({
        onkeyup: function (element) {
            this.element(element);
        },
        rules: {
            "krl-value": {
                required: true,
                normalizer: function (value) {
                    value = value.sanitise(C_SANITISE_LOWERCASE, C_APP_REGEX_ALPHANUMERIC_DIACRITIC);
                    $(this).val(value);
                    return value;
                }
            },
            "language": {
                required: {
                    depends: function () {
                        return !$("#keyword-release-modal-update [name=acronym-toggle]").is(':checked');
                    }
                }
            }
        },
        errorPlacement: function (error, element) {
            $("#keyword-release-modal-update [name=" + element[0].name + "-error-holder").append(error[0]);
        },
        submitHandler: function (form) {
            $(form).sanitiseForm();
            app.keyword.release.ajax.update();
        }
    }).resetForm();
};

/**
 * Save updated keyword.release via AJAX call.
 */
app.keyword.release.ajax.update = function () {
    //Get fields values at keyword-release-modal-update Modal
    var idn = $("#keyword-release-modal-update").find("[name='krl-code']").val();
    var rlsCode = $("#keyword-release-modal-update").find("[name='rls-code']").val();
    var krlValue = $("#keyword-release-modal-update").find("[name=krl-value]").val();
    var apiParams = {
        KrlCode: idn,
        KrlValue: krlValue,
        RlsCode: rlsCode,
        LngIsoCode: $("#keyword-release-modal-update [name=acronym-toggle]").is(':checked') ? null : $("#keyword-release-modal-update [name=language]").val()
    };
    var callbackParam = {
        KrlCode: idn,
        KrlValue: krlValue,
        RlsCode: rlsCode,
        idn: rlsCode
    };
    api.ajax.jsonrpc.request(app.config.url.api.jsonrpc.private,
        "PxStat.System.Navigation.Keyword_Release_API.Update",
        apiParams,
        "app.keyword.release.callback.updateOnSuccess",
        callbackParam,
        "app.keyword.release.callback.updateOnError",
        null,
        { async: false }
    );
};

/**
 * * Update keyword.release Callback
 * After AJAX call.
 * @param  {} data
 * @param  {} callbackParam
 */
app.keyword.release.callback.updateOnSuccess = function (data, callbackParam) {
    //Redraw Data Table keyword.release with fresh data.  
    app.keyword.release.ajax.read();
    $("#keyword-release-modal-update").modal("hide");

    if (data == C_API_AJAX_SUCCESS) {
        // Display Success Modal
        api.modal.success(app.library.html.parseDynamicLabel("success-record-updated", [callbackParam.KrlValue]));
    } else {
        api.modal.exception(app.label.static["api-ajax-exception"]);
    }
};

/**
 * * Update keyword.release Callback
 * After AJAX call.
 * @param  {} error
 */
app.keyword.release.callback.updateOnError = function (error) {
    //Redraw Data Table keyword.release with fresh data.  
    app.keyword.release.ajax.read();
    $("#keyword-release-modal-update").modal("hide");
};

//#endregion


//#regionsynonymrender

//Ajax call for synonym
app.keyword.release.ajax.synonym = function (row) {
    var KrlValue = row.KrlValue;
    var callbackParam = {
        KrlValue: KrlValue,

    };
    api.ajax.jsonrpc.request(
        app.config.url.api.jsonrpc.private,
        "PxStat.System.Navigation.Keyword_API.ReadSynonym",
        { "KrlValue": KrlValue },
        "app.keyword.release.callback.readSynonym",
        callbackParam);
}

//Call back for synonyms
app.keyword.release.callback.readSynonym = function (data, callbackParam) {
    //Add name of keyword selected
    $("#keyword-release-extra-info").find("[name=keyword]").html(callbackParam.KrlValue);
    //Clear list card
    $("#keyword-release-extra-info").find("[name=synonym-card]").empty();

    //Get each language
    $.each(data, function (key, language) {
        //Clone card
        var languageCard = $("#keyword-release-synonym-template").find("[name=synonym-language-card]").clone();
        //Display the Language
        languageCard.find(".card-header").text(language.LngIsoName);

        //Check if any synonyms
        if (language.Synonym.length) {

            //Get Synonyms
            $.each(language.Synonym, function (key, synonym) {


                var synonymItem = $("<li>", {
                    "class": "list-group-item",
                    "html": synonym
                });

                languageCard.find("[name=synonym-group]").append(synonymItem);


            });

        }
        else {
            //Display if no synonyms
            var synonymItem = $("<li>", {
                "class": "list-group-item",
                "html": app.label.static["no-synonyms"]
            });
            languageCard.find("[name=synonym-group]").append(synonymItem);
        }

        $("#keyword-release-extra-info").find("[name=synonym-card]").append(languageCard).get(0).outerHTML;

    });
}


//#endregion