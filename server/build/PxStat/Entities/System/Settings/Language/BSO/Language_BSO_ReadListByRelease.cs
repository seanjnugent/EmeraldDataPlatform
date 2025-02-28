﻿using API;
using PxStat.Template;

namespace PxStat.System.Settings
{
    /// <summary>
    /// Returns the list of languages for a release code
    /// </summary>
    internal class Language_BSO_ReadListByRelease : BaseTemplate_Read<Language_DTO_ReadList, Language_VLD_ReadListByRlease>
    {
        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="request"></param>
        internal Language_BSO_ReadListByRelease(JSONRPC_API request) : base(request, new Language_VLD_ReadListByRlease())
        {
        }

        /// <summary>
        /// Test privilege
        /// </summary>
        /// <returns></returns>
        override protected bool HasPrivilege()
        {
            return IsPowerUser() || IsModerator();
        }

        /// <summary>
        /// Execute
        /// </summary>
        /// <returns></returns>
        protected override bool Execute()
        {
            var adoLanguage = new Language_ADO(Ado);

            var response=adoLanguage.ReadListByRelease(DTO.RlsCode);

            if(response.Count>0)
                Response.data = response;
            else
            {
                Response.error = Label.Get("error.release.not-found",DTO.LngIsoCode );
                return false;
            }

            return true;
        }
    }
}

