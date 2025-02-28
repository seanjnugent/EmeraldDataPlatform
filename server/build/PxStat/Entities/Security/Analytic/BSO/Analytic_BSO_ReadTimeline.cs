﻿using API;
using PxStat.Template;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;

namespace PxStat.Security
{
    /// <summary>
    /// Reads summary information from Analytics
    /// </summary>
    internal class Analytic_BSO_ReadTimeline : BaseTemplate_Read<Analytic_DTO_Read, Analytic_VLD_ReadTimeline>
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="request"></param>
        internal Analytic_BSO_ReadTimeline(JSONRPC_API request) : base(request, new Analytic_VLD_ReadTimeline())
        { }

        /// <summary>
        /// Test privilege
        /// </summary>
        /// <returns></returns>
        override protected bool HasPrivilege()
        {
            if (IsPowerUser() || IsModerator())
                return true;


            return false;
        }


        protected override bool Execute()
        {
            if (IsModerator() && String.IsNullOrEmpty(DTO.MtrCode))
            {
                Response.error = Label.Get("error.privilege");
                return false;
            }

            MemCachedD_Value cache = ApiServicesHelper.CacheD.Get_BSO("PxStat.Security", "Analytic", "ReadTimeline", DTO);
            if (cache.hasData)
            {
                Response.data = cache.data;
                return true;
            }
            Analytic_ADO ado = new Analytic_ADO(Ado);

            // Sort outputSummary by ascending date
            List<dynamic> outputSummary = ado.ReadTimeline(DTO);
            outputSummary.Sort((x, y) => ((DateTime)x.DATE).CompareTo((DateTime)y.DATE));

            if (outputSummary != null)
            {
                ApiServicesHelper.CacheD.Store_BSO("PxStat.Security", "Analytic", "ReadTimeline", DTO, outputSummary, default(DateTime));
                Response.data = outputSummary;
                return true;
            }
            return false;
        }
    }


}
