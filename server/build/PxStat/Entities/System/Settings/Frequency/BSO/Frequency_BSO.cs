﻿using API;
using PxStat.Data;
using PxStat.Security;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;

namespace PxStat.System.Settings
{
    /// <summary>
    /// Frequency methods for use outside of API's 
    /// </summary>
    internal class Frequency_BSO
    {
        internal List<string> ReadAll()
        {
            List<string> configList = Configuration_BSO.GetStaticConfig("APP_PX_FREQUENCY_CODES").Split(',').ToList();
            List<string> frqList = new List<string>();
            foreach (var v in configList)
            {
                string[] item = v.Split('/');
                if (item.Length < 2) return null;
                frqList.Add(item[0]);
            }

            return frqList;
        }

        /// <summary>
        /// Read Frequency value from Frequency Code
        /// </summary>
        /// <param name="FrqCode"></param>
        /// <returns></returns>
        internal Frequency_DTO Read(string FrqCode)
        {
            string[] items=( Configuration_BSO.GetStaticConfig("APP_PX_FREQUENCY_CODES")).Split(',');
            List<string> configList = items.ToList<string>();
            Frequency_DTO dto = new Frequency_DTO(); ;
            foreach (var v in configList)
            {
                string[] item = v.Split('/');
                if (item.Length < 2) return null;

                dynamic freq = new ExpandoObject();
                if (FrqCode == item[0])
                {
                    dto = new Frequency_DTO();
                    dto.FrqCode = item[0];
                    //NOTE: Translation of item[1]; at Client side.
                    dto.FrqValue = item[1];
                    return dto;
                }

            }
            return dto;
        }
    }
}
